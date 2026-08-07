import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Media playback is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: recording } = await admin.from("recordings").select("audio_path, video_path, deleted_at").eq("session_id", id).eq("user_id", user.id).maybeSingle();
  if (!recording || recording.deleted_at) return NextResponse.json({ error: "This recording is no longer available." }, { status: 404 });
  const path = recording.video_path ?? recording.audio_path;
  if (!path) return NextResponse.json({ error: "This recording is no longer available." }, { status: 404 });
  const { data, error } = await admin.storage.from("recordings").createSignedUrl(path, 3600);
  if (error || !data) return NextResponse.json({ error: "Pulse could not open the private recording." }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, kind: recording.video_path ? "video" : "audio", expiresIn: 3600 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createSupabaseServerClient(); const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Deletion is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: recording } = await admin.from("recordings").select("audio_path, video_path").eq("session_id", id).eq("user_id", user.id).maybeSingle();
  if (!recording) return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  const paths = [recording.audio_path, recording.video_path].filter((path): path is string => Boolean(path));
  if (paths.length) await admin.storage.from("recordings").remove(paths);
  await admin.from("recordings").update({ audio_path: null, video_path: null, deleted_at: new Date().toISOString() }).eq("session_id", id).eq("user_id", user.id);
  return new NextResponse(null, { status: 204 });
}
