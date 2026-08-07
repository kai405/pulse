import type { Json } from "@/lib/db/database.types";
import { buildScorecard, THRESHOLD_SNAPSHOT, type AudioSample, type VisualSample } from "@/lib/scoring/session-analysis";
import type { MetricScore } from "@/lib/scoring/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LOCAL_ANALYSIS_VERSION = "pulse-local-signals-1.0.0";

type CaptureMetadata = { audioSamples?: AudioSample[]; visualSamples?: VisualSample[] };

type ObjectiveCandidate = {
  key: string;
  category: "delivery" | "visual";
  metric: MetricScore;
  weight: number;
  title: string;
  explanation: string;
  action: string;
};

export async function processObjectiveFallback(sessionId: string, userId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("SUPABASE_NOT_CONFIGURED");

  const [{ data: session, error: sessionError }, { data: recording, error: recordingError }] = await Promise.all([
    admin.from("practice_sessions").select("*").eq("id", sessionId).eq("user_id", userId).single(),
    admin.from("recordings").select("*").eq("session_id", sessionId).eq("user_id", userId).single(),
  ]);
  if (sessionError || !session || recordingError || !recording) throw new Error("SESSION_MEDIA_MISSING");

  const durationSeconds = Number(recording.duration_seconds ?? session.recording_duration_seconds ?? 0);
  const capture = (recording.capture_metadata ?? {}) as CaptureMetadata;
  const audioSamples = capture.audioSamples ?? [];
  const visualSamples = capture.visualSamples ?? [];
  const voicedSamples = audioSamples.filter((sample) => sample.rms >= 0.01 && !sample.clipping);

  if (durationSeconds < 10 || voicedSamples.length < 50 || voicedSamples.length / Math.max(1, audioSamples.length) < 0.25) {
    await admin.from("practice_sessions").update({
      status: "incomplete",
      current_stage: "incomplete",
      speaking_duration_seconds: durationSeconds,
      failure_code: "insufficient_speech",
      failure_message: "At least 10 seconds of clearly captured speech are required for an objective score.",
    }).eq("id", sessionId).eq("user_id", userId);
    return;
  }

  await admin.from("practice_sessions").update({ status: "measuring", current_stage: "measuring" }).eq("id", sessionId).eq("user_id", userId);

  const scorecard = buildScorecard({
    transcript: "",
    words: [],
    targetWpm: session.target_wpm,
    recordingSeconds: durationSeconds,
    targetSeconds: session.target_seconds,
    audioSamples,
    visualSamples,
    triggerWords: [],
    dimensions: [],
    hasFrames: visualSamples.length >= 8,
  });

  const candidates: ObjectiveCandidate[] = [
    { key: "vocal-variation", category: "delivery", metric: scorecard.objective.vocalVariation, weight: 5, title: "Use more intentional vocal contrast", explanation: "Your microphone signal showed limited variation in speaking energy.", action: "Repeat the response and deliberately emphasize one key phrase in each section." },
    { key: "duration", category: "delivery", metric: scorecard.objective.duration, weight: 5, title: "Land closer to the target time", explanation: "Your recorded duration was the clearest opportunity in this objective snapshot.", action: "Use a three-part outline and reserve the final 15% of the timer for your conclusion." },
    { key: "camera_engagement", category: "visual", metric: scorecard.objective.cameraEngagement, weight: 6, title: "Return to the camera more consistently", explanation: "The on-device orientation signal detected opportunities to face the camera more consistently.", action: "Place the prompt near the camera and return your gaze there at the end of each thought." },
    { key: "framing_presence", category: "visual", metric: scorecard.objective.framingPresence, weight: 3, title: "Stabilize your framing", explanation: "The on-device framing signal varied during this recording.", action: "Set the camera at eye level and keep your head and shoulders inside the preview guide." },
  ];
  const available = candidates.filter((item) => item.metric.available && item.metric.score !== null);
  if (!available.length) {
    await admin.from("practice_sessions").update({
      status: "incomplete",
      current_stage: "incomplete",
      speaking_duration_seconds: durationSeconds,
      failure_code: "insufficient_signal",
      failure_message: "Pulse could not collect enough reliable audio or visual signal for a score.",
    }).eq("id", sessionId).eq("user_id", userId);
    return;
  }

  const weightedScore = (items: ObjectiveCandidate[]) => {
    const usable = items.filter((item) => item.metric.score !== null);
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    return totalWeight ? Math.round(usable.reduce((sum, item) => sum + (item.metric.score ?? 0) * item.weight, 0) / totalWeight) : null;
  };
  const overallScore = weightedScore(available);
  const deliveryScore = weightedScore(available.filter((item) => item.category === "delivery"));
  const visualScore = weightedScore(available.filter((item) => item.category === "visual"));
  const strongest = [...available].sort((a, b) => (b.metric.score ?? 0) - (a.metric.score ?? 0))[0]!;
  const priority = [...available].sort((a, b) => (a.metric.score ?? 0) - (b.metric.score ?? 0))[0]!;
  const unavailableCategories = ["fluency", "content", "confidence", ...(visualScore === null ? ["visual"] : [])];

  await admin.from("practice_sessions").update({ status: "finalizing", current_stage: "finalizing" }).eq("id", sessionId).eq("user_id", userId);

  const transcriptNotice = "Transcript unavailable. This partial result uses on-device audio and visual measurements only.";
  const { data: transcript, error: transcriptError } = await admin.from("transcripts").insert({
    session_id: sessionId,
    user_id: userId,
    analysis_version: session.active_analysis_version,
    transcript_text: transcriptNotice,
    provider: "local-signals",
    model_id: LOCAL_ANALYSIS_VERSION,
    language: "en",
    confidence: "low",
    source_hash: null,
  }).select("id").single();
  if (transcriptError || !transcript) throw new Error("TRANSCRIPT_PERSIST_FAILED");
  await admin.from("transcript_segments").insert({
    transcript_id: transcript.id,
    user_id: userId,
    ordinal: 0,
    start_ms: 0,
    end_ms: Math.round(durationSeconds * 1000),
    text: transcriptNotice,
    confidence: null,
    words: [] as unknown as Json,
  });

  const categoryScores = { delivery: deliveryScore, fluency: null, content: null, visual: visualScore, confidence: null };
  const availableWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const { data: analysis, error: analysisError } = await admin.from("analysis_results").insert({
    session_id: sessionId,
    user_id: userId,
    analysis_version: session.active_analysis_version,
    rubric_version: session.rubric_version,
    evaluator_prompt_version: LOCAL_ANALYSIS_VERSION,
    model_id: null,
    overall_score: overallScore,
    category_scores: categoryScores as unknown as Json,
    summary: "This objective delivery snapshot is calculated from the recording duration, vocal-energy variation, and reliable on-device camera signals. Transcript and semantic feedback were unavailable and are not estimated.",
    strongest_dimension: strongest.category,
    priority_improvement: priority.title,
    next_action: priority.action,
    confidence_summary: { mode: "objective-only", availableSignals: available.map((item) => item.key) } as unknown as Json,
    missing_metrics: unavailableCategories,
    threshold_snapshot: THRESHOLD_SNAPSHOT as unknown as Json,
    aggregation_metadata: { mode: "objective-only", availableWeight, configuredWeight: 19, omitted: candidates.filter((item) => !item.metric.available).map((item) => item.key) } as unknown as Json,
    raw_structured_output: null,
  }).select("id").single();
  if (analysisError || !analysis) throw new Error("ANALYSIS_PERSIST_FAILED");

  await admin.from("metric_results").insert(candidates.map((item) => ({
    analysis_id: analysis.id,
    user_id: userId,
    metric_key: item.key,
    category: item.category,
    numeric_value: item.metric.value ?? null,
    unit: item.metric.unit ?? null,
    score: item.metric.score,
    confidence: item.metric.confidence,
    available: item.metric.available,
    unavailable_reason: item.metric.reason ?? null,
    evidence: (item.metric.evidence ?? []) as unknown as Json,
  })));
  await admin.from("feedback_items").insert([
    { analysis_id: analysis.id, user_id: userId, item_type: "strength", category: strongest.category, priority: 0, title: "Strongest measured signal", explanation: `${strongest.title.replace(/^Use|^Return|^Land|^Stabilize/, "You showed")}: ${strongest.metric.score}/100.`, action: null, evidence: [] as unknown as Json },
    { analysis_id: analysis.id, user_id: userId, item_type: "recommendation", category: priority.category, priority: 0, title: priority.title, explanation: priority.explanation, action: priority.action, evidence: [] as unknown as Json },
  ]);

  await admin.from("practice_sessions").update({
    status: "partial",
    current_stage: "partial",
    speaking_duration_seconds: durationSeconds,
    completed_at: new Date().toISOString(),
    failure_code: "provider_configuration",
    failure_message: "Objective delivery scoring completed. Transcript and semantic feedback require the configured AI provider.",
  }).eq("id", sessionId).eq("user_id", userId);
}
