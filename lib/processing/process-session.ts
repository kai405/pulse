import { createHash } from "node:crypto";
import OpenAI, { toFile } from "openai";
import { evaluateSession, EVALUATOR_MODEL, EVALUATOR_PROMPT_VERSION, validateEvaluatorEvidence } from "@/lib/ai/evaluator";
import type { DimensionEvaluation, EvaluatorOutput } from "@/lib/ai/schema";
import type { Json } from "@/lib/db/database.types";
import { getServerEnv } from "@/lib/env";
import { countWords } from "@/lib/scoring/tokenize";
import { buildScorecard, THRESHOLD_SNAPSHOT, type AudioSample, type VisualSample } from "@/lib/scoring/session-analysis";
import type { MetricScore, WordTiming } from "@/lib/scoring/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDuration } from "@/lib/utils";

type CaptureMetadata = { audioSamples?: AudioSample[]; visualSamples?: VisualSample[] };

export async function processSession(sessionId: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const env = getServerEnv();
  if (!admin) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!env.OPENAI_API_KEY) {
    await failSession(sessionId, "provider_configuration", "Live analysis requires an OpenAI API key.");
    return;
  }
  try {
    const [{ data: session, error: sessionError }, { data: recording, error: recordingError }, { data: triggerRows }] = await Promise.all([
      admin.from("practice_sessions").select("*").eq("id", sessionId).eq("user_id", userId).single(),
      admin.from("recordings").select("*").eq("session_id", sessionId).eq("user_id", userId).single(),
      admin.from("trigger_words").select("phrase").eq("user_id", userId).eq("enabled", true),
    ]);
    if (sessionError || !session || recordingError || !recording?.audio_path) throw new Error("SESSION_MEDIA_MISSING");
    await setStage(sessionId, "transcribing", "transcribing");
    const { data: audioData, error: audioError } = await admin.storage.from("recordings").download(recording.audio_path);
    if (audioError || !audioData) throw new Error("AUDIO_DOWNLOAD_FAILED");
    const audioBuffer = Buffer.from(await audioData.arrayBuffer());
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, `session-${sessionId}.webm`, { type: recording.audio_mime ?? "audio/webm" }),
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    });
    const words: WordTiming[] = (transcription.words ?? []).map((word) => ({ word: word.word, start: word.start, end: word.end }));
    const transcriptText = transcription.text.trim();
    const speakingSeconds = words.length ? Math.max(0, (words.at(-1)?.end ?? 0) - (words[0]?.start ?? 0)) : 0;
    if (recording.duration_seconds !== null && (recording.duration_seconds < 10 || countWords(transcriptText) < 20 || speakingSeconds < 10)) {
      await admin.from("practice_sessions").update({ status: "incomplete", current_stage: "incomplete", speaking_duration_seconds: speakingSeconds, failure_code: "insufficient_speech", failure_message: "At least 10 seconds and 20 spoken words are required." }).eq("id", sessionId);
      return;
    }
    const sourceHash = createHash("sha256").update(audioBuffer).digest("hex");
    const { data: transcriptRow, error: transcriptError } = await admin.from("transcripts").insert({ session_id: sessionId, user_id: userId, analysis_version: session.active_analysis_version, transcript_text: transcriptText, provider: "openai", model_id: "whisper-1", language: transcription.language ?? "en", confidence: "medium", source_hash: sourceHash }).select("id").single();
    if (transcriptError || !transcriptRow) throw new Error("TRANSCRIPT_PERSIST_FAILED");
    const segments = (transcription.segments ?? []).map((segment, index) => ({ id: crypto.randomUUID(), transcript_id: transcriptRow.id, user_id: userId, ordinal: index, start_ms: Math.round(segment.start * 1000), end_ms: Math.round(segment.end * 1000), text: segment.text.trim(), confidence: null, words: words.filter((word) => word.start >= segment.start && word.end <= segment.end) as unknown as Json }));
    if (segments.length) {
      const { error } = await admin.from("transcript_segments").insert(segments);
      if (error) throw new Error("SEGMENT_PERSIST_FAILED");
    }
    await setStage(sessionId, "measuring", "measuring");
    const { data: frameRows } = await admin.from("visual_samples").select("timestamp_ms, frame_path").eq("session_id", sessionId).order("timestamp_ms").limit(48);
    const frames = (await Promise.all((frameRows ?? []).map(async (frame) => {
      if (!frame.frame_path) return null;
      const { data, error } = await admin.storage.from("analysis-frames").download(frame.frame_path);
      if (error || !data) return null;
      return { timestampMs: frame.timestamp_ms, dataUrl: `data:image/jpeg;base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}` };
    }))).filter((frame): frame is { timestampMs: number; dataUrl: string } => frame !== null);
    const captureMetadata = (recording.capture_metadata ?? {}) as CaptureMetadata;
    const triggerWords = (triggerRows ?? []).map((row) => row.phrase);
    const preMetrics = buildScorecard({ transcript: transcriptText, words, targetWpm: session.target_wpm, recordingSeconds: recording.duration_seconds ?? speakingSeconds, targetSeconds: session.target_seconds, audioSamples: captureMetadata.audioSamples ?? [], visualSamples: captureMetadata.visualSamples ?? [], triggerWords, dimensions: [], hasFrames: frames.length > 0 });
    await setStage(sessionId, "evaluating", "evaluating");
    let evaluation: EvaluatorOutput | null = null;
    try {
      const timestampedTranscript = (transcription.segments ?? []).map((segment) => `[${formatDuration(segment.start)}–${formatDuration(segment.end)}] ${segment.text.trim()}`).join("\n") || `[00:00] ${transcriptText}`;
      evaluation = validateEvaluatorEvidence(await evaluateSession({ userId, prompt: session.prompt_snapshot, mode: session.mode, difficulty: session.difficulty, targetSeconds: session.target_seconds, transcript: transcriptText, transcriptWithTimestamps: timestampedTranscript, metrics: { words: words.length, wpm: preMetrics.wpm, fillerCount: preMetrics.fillers.length, fillerRate: preMetrics.objective.fillerRate.value ?? null, pauseCount: preMetrics.pauses.length, longPauses: preMetrics.pauses.filter((pause) => pause.kind === "long").length, repetitionCount: preMetrics.repetitions.length, repeatedPhraseCount: preMetrics.repeatedPhrases.reduce((sum, phrase) => sum + phrase.count - 1, 0), customTriggerCount: preMetrics.triggerMatches.length, durationSeconds: recording.duration_seconds, targetSeconds: session.target_seconds }, frames }), transcriptText, frames.map((frame) => frame.timestampMs));
    } catch {
      evaluation = null;
    }
    await setStage(sessionId, "finalizing", "finalizing");
    const scorecard = buildScorecard({ transcript: transcriptText, words, targetWpm: session.target_wpm, recordingSeconds: recording.duration_seconds ?? speakingSeconds, targetSeconds: session.target_seconds, audioSamples: captureMetadata.audioSamples ?? [], visualSamples: captureMetadata.visualSamples ?? [], triggerWords, dimensions: evaluation?.dimensions ?? [], hasFrames: frames.length > 0 });
    const missing = Object.entries(scorecard.categoryScores).filter(([, value]) => value.score === null).map(([key]) => key);
    const { data: analysis, error: analysisError } = await admin.from("analysis_results").insert({ session_id: sessionId, user_id: userId, analysis_version: session.active_analysis_version, rubric_version: session.rubric_version, evaluator_prompt_version: EVALUATOR_PROMPT_VERSION, model_id: evaluation ? EVALUATOR_MODEL : null, overall_score: scorecard.overall.score, category_scores: Object.fromEntries(Object.entries(scorecard.categoryScores).map(([key, value]) => [key, value.score])) as Json, summary: evaluation?.summary ?? "Objective delivery measurements are ready. Semantic feedback could not be completed.", strongest_dimension: evaluation?.strongestDimension ?? null, priority_improvement: evaluation?.priorityImprovement ?? "Review the objective measurements below.", next_action: evaluation?.nextAction ?? "Retry semantic analysis when the provider is available.", confidence_summary: {} as Json, missing_metrics: missing, threshold_snapshot: THRESHOLD_SNAPSHOT as unknown as Json, aggregation_metadata: { availableWeight: scorecard.overall.availableWeight, configuredWeight: scorecard.overall.configuredWeight, omitted: scorecard.overall.omitted } as Json, raw_structured_output: evaluation as unknown as Json | null }).select("id").single();
    if (analysisError || !analysis) throw new Error("ANALYSIS_PERSIST_FAILED");
    const triggerMetric: MetricScore = { key: "trigger-words", score: null, available: true, confidence: "high", value: scorecard.triggerMatches.length, unit: "events", evidence: scorecard.triggerMatches.map((match) => ({ startMs: Math.round(match.start * 1000), endMs: Math.round(match.end * 1000), label: match.phrase })) };
    const objectiveEntries: [string, string, MetricScore][] = [["pace", "delivery", scorecard.objective.pace], ["pace-consistency", "delivery", scorecard.objective.paceConsistency], ["pause-rhythm", "delivery", scorecard.objective.pauseRhythm], ["vocal-variation", "delivery", scorecard.objective.vocalVariation], ["duration", "delivery", scorecard.objective.duration], ["fillers", "fluency", scorecard.objective.fillerRate], ["repetition", "fluency", scorecard.objective.repetition], ["trigger-words", "fluency", triggerMetric], ["camera_engagement", "visual", scorecard.objective.cameraEngagement], ["framing_presence", "visual", scorecard.objective.framingPresence]];
    const metricRows = [
      ...objectiveEntries.map(([key, category, metric]) => ({ analysis_id: analysis.id, user_id: userId, metric_key: key, category, numeric_value: metric.value ?? null, unit: metric.unit ?? null, score: metric.score, confidence: metric.confidence, available: metric.available, unavailable_reason: metric.reason ?? null, evidence: (metric.evidence ?? []) as unknown as Json })),
      ...(evaluation?.dimensions ?? []).map((item) => ({ analysis_id: analysis.id, user_id: userId, metric_key: item.key, category: categoryForDimension(item.key), numeric_value: null, unit: null, score: item.score, confidence: item.confidence, available: item.confidence !== "low", unavailable_reason: item.confidence === "low" ? item.unableReason : null, evidence: item.evidence as unknown as Json })),
    ];
    if (metricRows.length) await admin.from("metric_results").insert(metricRows);
    if (evaluation) {
      const feedbackRows = [
        ...evaluation.strengths.map((item, index) => ({ analysis_id: analysis.id, user_id: userId, item_type: "strength", priority: index, title: item.title, explanation: item.explanation, action: null, evidence: item.evidence as unknown as Json })),
        ...evaluation.recommendations.map((item, index) => ({ analysis_id: analysis.id, user_id: userId, item_type: "recommendation", priority: index, title: item.title, explanation: item.why, action: item.action, evidence: item.evidence as unknown as Json })),
      ];
      await admin.from("feedback_items").insert(feedbackRows);
    }
    await admin.from("practice_sessions").update({ status: evaluation ? "completed" : "partial", current_stage: evaluation ? "completed" : "partial", speaking_duration_seconds: speakingSeconds, completed_at: new Date().toISOString(), failure_code: evaluation ? null : "semantic_analysis_failed", failure_message: evaluation ? null : "Objective analysis completed; semantic feedback can be retried." }).eq("id", sessionId);
  } catch (error) {
    await failSession(sessionId, "processing_failed", safeProcessingMessage(error));
    throw error;
  }
}

async function setStage(sessionId: string, status: "transcribing" | "measuring" | "evaluating" | "finalizing", stage: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin.from("practice_sessions").update({ status, current_stage: stage, failure_code: null, failure_message: null }).eq("id", sessionId);
}

async function failSession(sessionId: string, code: string, message: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin.from("practice_sessions").update({ status: "failed", current_stage: "failed", failure_code: code, failure_message: message }).eq("id", sessionId);
}

function safeProcessingMessage(error: unknown) {
  if (error instanceof Error && error.message === "SESSION_MEDIA_MISSING") return "Pulse could not find the saved recording for this session.";
  return "Pulse could not complete this analysis. The recording remains saved and can be retried.";
}

function categoryForDimension(key: DimensionEvaluation["key"]) {
  if (["verbal_clarity", "sentence_flow"].includes(key)) return "fluency";
  if (["organization", "clarity_of_ideas", "conciseness", "relevance", "opening", "conclusion"].includes(key)) return "content";
  if (["camera_engagement", "framing_presence", "facial_engagement", "purposeful_movement"].includes(key)) return "visual";
  return "confidence";
}
