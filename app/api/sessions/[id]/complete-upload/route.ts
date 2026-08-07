import { NextResponse } from "next/server";
import { queueSession } from "@/lib/processing/queue-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeSessionSchema } from "@/lib/validation/session";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = completeSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Upload completion metadata was invalid." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Persistent sessions are not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Your session expired." }, { status: 401 });
  const { data: session } = await admin.from("practice_sessions").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  const { audioSamples, visualSamples, frames, durationSeconds } = parsed.data;
  const { error: recordingError } = await admin.from("recordings").update({ duration_seconds: durationSeconds, capture_metadata: { audioSamples, visualSamples } }).eq("session_id", id).eq("user_id", user.id);
  if (recordingError) return NextResponse.json({ error: "Pulse could not finalize the recording metadata." }, { status: 503 });
  if (frames.length) {
    const { error: frameError } = await admin.from("visual_samples").insert(frames.map((frame) => ({ session_id: id, user_id: user.id, timestamp_ms: frame.timestampMs, local_confidence: "low" as const, measurements: {}, frame_path: frame.path })));
    if (frameError) return NextResponse.json({ error: "Pulse saved the recording but could not finalize visual samples." }, { status: 503 });
  }
  await admin.from("practice_sessions").update({ status: "queued", current_stage: "queued", failure_code: null, failure_message: null }).eq("id", id);
  await queueSession(id, user.id);
  return NextResponse.json({ id, status: "queued" }, { status: 202 });
}
