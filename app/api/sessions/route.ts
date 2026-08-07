import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSessionSchema } from "@/lib/validation/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = createSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The recording metadata was invalid. Nothing was uploaded." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Persistent sessions are not configured. View the labeled sample or add Supabase credentials." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your guest session expired. Sign in again before uploading." }, { status: 401 });
  const rateLimit = consumeRateLimit(`session-create:${user.id}`, 20, 60 * 60_000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Session creation limit reached. Try again later; your recording remains in this tab." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
  const { data: profile } = await admin.from("profiles").select("target_wpm, media_retention_days").eq("user_id", user.id).maybeSingle();
  const { config, durationSeconds, audio, video, frameTimestamps } = parsed.data;
  const { data: session, error: sessionError } = await admin.from("practice_sessions").insert({ user_id: user.id, prompt_id: config.promptId, prompt_snapshot: config.prompt, mode: config.mode, category: config.category, difficulty: config.difficulty, target_seconds: config.targetSeconds, preparation_seconds: config.preparationSeconds, target_wpm: profile?.target_wpm ?? 140, video_enabled: Boolean(video), recording_duration_seconds: durationSeconds, status: "uploading", current_stage: "saving", rubric_version: "pulse-1.0.0" }).select("id").single();
  if (sessionError || !session) return NextResponse.json({ error: "Pulse could not create a private session for this recording." }, { status: 503 });
  const extension = (mime: string, kind: "audio" | "video") => mime.includes("mp4") ? (kind === "audio" ? "m4a" : "mp4") : "webm";
  const audioPath = `${user.id}/${session.id}/audio.${extension(audio.mime, "audio")}`;
  const videoPath = video ? `${user.id}/${session.id}/video.${extension(video.mime, "video")}` : null;
  const expiresAt = new Date(Date.now() + (profile?.media_retention_days ?? 30) * 86_400_000).toISOString();
  const { error: recordingError } = await admin.from("recordings").insert({ session_id: session.id, user_id: user.id, audio_path: audioPath, video_path: videoPath, audio_mime: audio.mime, video_mime: video?.mime ?? null, audio_bytes: audio.bytes, video_bytes: video?.bytes ?? null, duration_seconds: durationSeconds, expires_at: expiresAt });
  if (recordingError) { await admin.from("practice_sessions").delete().eq("id", session.id); return NextResponse.json({ error: "Pulse could not reserve private storage for this recording." }, { status: 503 }); }
  const audioTarget = await admin.storage.from("recordings").createSignedUploadUrl(audioPath);
  const videoTarget = videoPath ? await admin.storage.from("recordings").createSignedUploadUrl(videoPath) : null;
  const frameTargets = await Promise.all(frameTimestamps.map(async (timestampMs, index) => {
    const path = `${user.id}/${session.id}/frame-${String(index).padStart(2, "0")}-${timestampMs}.jpg`;
    const signed = await admin.storage.from("analysis-frames").createSignedUploadUrl(path);
    return signed.data ? { timestampMs, path, token: signed.data.token } : null;
  }));
  if (audioTarget.error || !audioTarget.data || (videoPath && (!videoTarget?.data || videoTarget.error)) || frameTargets.some((target) => !target)) {
    await admin.from("practice_sessions").update({ status: "failed", current_stage: "failed", failure_code: "upload_intent_failed", failure_message: "Pulse could not prepare secure uploads." }).eq("id", session.id);
    return NextResponse.json({ error: "Pulse could not prepare secure uploads. Your recording remains in this tab." }, { status: 503 });
  }
  return NextResponse.json({ id: session.id, uploads: { audio: { path: audioPath, token: audioTarget.data.token }, video: videoTarget?.data && videoPath ? { path: videoPath, token: videoTarget.data.token } : null, frames: frameTargets } });
}
