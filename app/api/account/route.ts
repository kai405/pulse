import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Account deletion is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: recordings }, { data: frames }] = await Promise.all([admin.from("recordings").select("audio_path, video_path").eq("user_id", user.id), admin.from("visual_samples").select("frame_path").eq("user_id", user.id)]);
  const recordingPaths = (recordings ?? []).flatMap((recording) => [recording.audio_path, recording.video_path]).filter((path): path is string => Boolean(path));
  const framePaths = (frames ?? []).flatMap((frame) => frame.frame_path ? [frame.frame_path] : []);
  if (recordingPaths.length) await admin.storage.from("recordings").remove(recordingPaths);
  if (framePaths.length) await admin.storage.from("analysis-frames").remove(framePaths);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Pulse could not complete account deletion." }, { status: 503 });
  return new NextResponse(null, { status: 204 });
}
