import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Retention is not configured." }, { status: 503 });
  const now = new Date().toISOString();
  const { data: expiredMedia } = await admin.from("recordings").select("id, session_id, audio_path, video_path").lt("expires_at", now).is("deleted_at", null).limit(200);
  let mediaDeleted = 0;
  for (const recording of expiredMedia ?? []) {
    const paths = [recording.audio_path, recording.video_path].filter((path): path is string => Boolean(path));
    const { data: frames } = await admin.from("visual_samples").select("frame_path").eq("session_id", recording.session_id);
    const framePaths = (frames ?? []).flatMap((frame) => frame.frame_path ? [frame.frame_path] : []);
    if (paths.length) await admin.storage.from("recordings").remove(paths);
    if (framePaths.length) await admin.storage.from("analysis-frames").remove(framePaths);
    await admin.from("recordings").update({ audio_path: null, video_path: null, deleted_at: now }).eq("id", recording.id);
    await admin.from("visual_samples").delete().eq("session_id", recording.session_id);
    mediaDeleted += 1;
  }
  const { data: expiredGuests } = await admin.from("profiles").select("user_id").lt("guest_expires_at", now).limit(100);
  let guestsDeleted = 0;
  for (const guest of expiredGuests ?? []) {
    const [{ data: recordings }, { data: frames }] = await Promise.all([admin.from("recordings").select("audio_path, video_path").eq("user_id", guest.user_id), admin.from("visual_samples").select("frame_path").eq("user_id", guest.user_id)]);
    const recordingPaths = (recordings ?? []).flatMap((item) => [item.audio_path, item.video_path]).filter((path): path is string => Boolean(path));
    const framePaths = (frames ?? []).flatMap((item) => item.frame_path ? [item.frame_path] : []);
    if (recordingPaths.length) await admin.storage.from("recordings").remove(recordingPaths);
    if (framePaths.length) await admin.storage.from("analysis-frames").remove(framePaths);
    const { error } = await admin.auth.admin.deleteUser(guest.user_id);
    if (!error) guestsDeleted += 1;
  }
  return NextResponse.json({ mediaDeleted, guestsDeleted, checkedAt: now });
}
