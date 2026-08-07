import { evaluatorOutputSchema } from "@/lib/ai/schema";
import type { Json } from "@/lib/db/database.types";
import type { PracticeMode } from "@/lib/product";
import type { SessionResultView } from "@/lib/results";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CATEGORY_META = {
  delivery: { label: "Delivery mechanics", fallback: "Pace, pauses, vocal variation, and timing adherence." },
  fluency: { label: "Fluency", fallback: "Filler rate, repetition, verbal clarity, and sentence flow." },
  content: { label: "Structure & content", fallback: "Organization, clarity, conciseness, relevance, opening, and conclusion." },
  visual: { label: "Visual presence", fallback: "Camera orientation, framing, visible expression, and movement." },
  confidence: { label: "Confident delivery", fallback: "Observable commitment, composure, audibility, and completed thoughts." },
} as const;

export async function getOwnedSessionResult(id: string): Promise<SessionResultView | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: session } = await supabase.from("practice_sessions").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!session || !["completed", "partial"].includes(session.status)) return null;
  const [{ data: analysis }, { data: transcript }] = await Promise.all([
    supabase.from("analysis_results").select("*").eq("session_id", id).eq("analysis_version", session.active_analysis_version).maybeSingle(),
    supabase.from("transcripts").select("*").eq("session_id", id).eq("analysis_version", session.active_analysis_version).maybeSingle(),
  ]);
  if (!analysis || !transcript) return null;
  const [{ data: segments }, { data: metrics }, { data: feedback }, { data: previousSession }] = await Promise.all([
    supabase.from("transcript_segments").select("*").eq("transcript_id", transcript.id).order("ordinal"),
    supabase.from("metric_results").select("*").eq("analysis_id", analysis.id),
    supabase.from("feedback_items").select("*").eq("analysis_id", analysis.id).order("priority"),
    supabase.from("practice_sessions").select("id, active_analysis_version").eq("user_id", user.id).eq("mode", session.mode).eq("rubric_version", session.rubric_version).in("status", ["completed", "partial"]).lt("created_at", session.created_at).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { data: previousAnalysis } = previousSession
    ? await supabase.from("analysis_results").select("overall_score, category_scores").eq("session_id", previousSession.id).eq("analysis_version", previousSession.active_analysis_version).maybeSingle()
    : { data: null };
  const parsedEvaluation = evaluatorOutputSchema.safeParse(analysis.raw_structured_output);
  const evaluation = parsedEvaluation.success ? parsedEvaluation.data : null;
  const categoryScores = parseNumberMap(analysis.category_scores);
  const previousCategoryScores = parseNumberMap(previousAnalysis?.category_scores ?? null);
  const metric = (key: string) => metrics?.find((item) => item.metric_key === key);
  const categoryConfidence = (key: keyof typeof CATEGORY_META): "High" | "Medium" | "Low" => {
    const categoryMetrics = metrics?.filter((item) => item.category === key && item.available) ?? [];
    if (!categoryMetrics.length) return "Low";
    return categoryMetrics.some((item) => item.confidence === "low") ? "Low" : categoryMetrics.some((item) => item.confidence === "medium") ? "Medium" : "High";
  };
  const dimensionSummary = (keys: string[]) => evaluation?.dimensions.find((item) => keys.includes(item.key))?.explanation;
  const categories = (Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((key) => ({
    key,
    label: CATEGORY_META[key].label,
    score: typeof categoryScores[key] === "number" ? Math.round(categoryScores[key]) : null,
    delta: previousAnalysis && typeof categoryScores[key] === "number" && typeof previousCategoryScores[key] === "number" ? Math.round(categoryScores[key] - previousCategoryScores[key]) : null,
    confidence: categoryConfidence(key),
    summary: dimensionSummary(key === "delivery" ? [] : key === "fluency" ? ["verbal_clarity", "sentence_flow"] : key === "content" ? ["organization", "clarity_of_ideas"] : key === "visual" ? ["camera_engagement", "purposeful_movement"] : ["confident_delivery"]) ?? CATEGORY_META[key].fallback,
  }));
  const fillerWords = ["um", "uh", "erm", "you know", "i mean", "basically"];
  const objectiveEvidence = (metrics ?? []).flatMap((item) => parseEvidence(item.evidence).map((evidence) => ({ ...evidence, metricKey: item.metric_key })));
  const transcriptSegments = (segments ?? []).map((segment) => ({ id: segment.id, start: segment.start_ms / 1000, end: segment.end_ms / 1000, text: segment.text, marks: [...new Set([...fillerWords.filter((filler) => segment.text.toLocaleLowerCase().includes(filler)), ...objectiveEvidence.filter((evidence) => evidence.startMs < segment.end_ms && evidence.endMs > segment.start_ms && ["trigger-words", "repetition"].includes(evidence.metricKey)).map((evidence) => evidence.label.replace(/^(Repeated (word|phrase)|Filler):\s*/i, ""))])] }));
  const evidenceEvents = [
    ...objectiveEvidence.map((evidence) => ({ time: evidence.startMs / 1000, type: evidence.metricKey, label: evidence.label, tone: ["fillers", "repetition", "trigger-words"].includes(evidence.metricKey) ? "warning" as const : "neutral" as const })),
    ...(evaluation?.dimensions ?? []).flatMap((dimension) => dimension.evidence.slice(0, 1).map((evidence) => ({ time: evidence.startMs / 1000, type: dimension.key, label: dimension.explanation, tone: dimension.score >= 80 ? "success" as const : dimension.score <= 40 ? "warning" as const : "neutral" as const }))),
  ].sort((a, b) => a.time - b.time);
  const recommendationItems = (feedback ?? []).filter((item) => item.item_type === "recommendation");
  const strengths = (feedback ?? []).filter((item) => item.item_type === "strength").map((item) => item.explanation);
  return {
    id: session.id,
    createdAt: session.created_at,
    prompt: session.prompt_snapshot,
    mode: session.mode as PracticeMode,
    durationSeconds: Number(session.recording_duration_seconds ?? 0),
    targetSeconds: session.target_seconds,
    score: analysis.overall_score,
    status: session.status,
    rubricVersion: analysis.rubric_version,
    previousScore: previousAnalysis?.overall_score ?? analysis.overall_score ?? 0,
    words: transcriptSegments.reduce((sum, item) => sum + item.text.split(/\s+/).filter(Boolean).length, 0),
    wpm: metric("pace")?.numeric_value == null ? null : Number(metric("pace")?.numeric_value),
    fillerRate: metric("fillers")?.numeric_value == null ? null : Number(metric("fillers")?.numeric_value),
    cameraEngagement: metric("camera_engagement")?.score == null ? null : Number(metric("camera_engagement")?.score),
    strongest: humanize(analysis.strongest_dimension ?? "content"),
    priority: analysis.priority_improvement ?? "Review your evidence",
    summary: analysis.summary ?? "Your analysis is ready.",
    categories,
    transcript: transcriptSegments,
    timeline: evidenceEvents.slice(0, 20),
    strengths: strengths.length ? strengths : ["The completed session produced enough reliable evidence to support feedback."],
    recommendations: recommendationItems.slice(0, 2).map((item, index) => ({ priority: index === 0 ? "Primary" : "Supporting", title: item.title, why: item.explanation, action: item.action ?? "Repeat the practice with this behavior in focus." })),
  };
}

function parseEvidence(value: Json) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") return [];
    const startMs = item.startMs;
    const endMs = item.endMs;
    const label = item.label;
    return typeof startMs === "number" && typeof endMs === "number" && typeof label === "string" ? [{ startMs, endMs, label }] : [];
  });
}

function parseNumberMap(value: Json): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => typeof item === "number" ? [[key, item]] : []));
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}
