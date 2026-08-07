import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Deletion is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: recording }, { data: frames }] = await Promise.all([admin.from("recordings").select("audio_path, video_path").eq("session_id", id).eq("user_id", user.id).maybeSingle(), admin.from("visual_samples").select("frame_path").eq("session_id", id).eq("user_id", user.id)]);
  const recordingPaths = [recording?.audio_path, recording?.video_path].filter((path): path is string => Boolean(path));
  const framePaths = (frames ?? []).flatMap((frame) => frame.frame_path ? [frame.frame_path] : []);
  if (recordingPaths.length) await admin.storage.from("recordings").remove(recordingPaths);
  if (framePaths.length) await admin.storage.from("analysis-frames").remove(framePaths);
  const { data, error } = await admin.from("practice_sessions").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
