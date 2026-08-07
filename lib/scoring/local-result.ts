import type { PracticeMode } from "@/lib/product";
import type { SessionResultView } from "@/lib/results";
import { buildScorecard, type AudioSample, type VisualSample } from "@/lib/scoring/session-analysis";
import type { MetricScore } from "@/lib/scoring/types";

type LocalInput = {
  config: {
    mode: PracticeMode;
    prompt: string;
    targetSeconds: number;
  };
  durationSeconds: number;
  audioSamples: AudioSample[];
  visualSamples: VisualSample[];
  localMedia?: { url: string; kind: "audio" | "video" };
};

type Candidate = {
  key: string;
  label: string;
  category: "delivery" | "visual";
  weight: number;
  metric: MetricScore;
  strength: string;
  title: string;
  why: string;
  action: string;
};

function weightedScore(items: Candidate[]) {
  const available = items.filter((item) => item.metric.available && item.metric.score !== null);
  const weight = available.reduce((sum, item) => sum + item.weight, 0);
  return weight ? Math.round(available.reduce((sum, item) => sum + (item.metric.score ?? 0) * item.weight, 0) / weight) : null;
}

export function createLocalSessionResult(input: LocalInput): SessionResultView {
  const scorecard = buildScorecard({
    transcript: "",
    words: [],
    targetWpm: 140,
    recordingSeconds: input.durationSeconds,
    targetSeconds: input.config.targetSeconds,
    audioSamples: input.audioSamples,
    visualSamples: input.visualSamples,
    triggerWords: [],
    dimensions: [],
    hasFrames: input.visualSamples.length >= 8,
  });

  const candidates: Candidate[] = [
    {
      key: "vocal-variation", label: "Vocal variation", category: "delivery", weight: 5, metric: scorecard.objective.vocalVariation,
      strength: "Your vocal energy created audible contrast across the response.",
      title: "Add intentional vocal contrast",
      why: "The recorded microphone signal shows where vocal energy can vary more clearly.",
      action: "Repeat the answer and emphasize one key phrase in each section.",
    },
    {
      key: "duration", label: "Target timing", category: "delivery", weight: 5, metric: scorecard.objective.duration,
      strength: "Your response used the available speaking time effectively.",
      title: "Land closer to the target time",
      why: "The recorded duration is the clearest timing signal in this response.",
      action: "Use a three-part outline and reserve the final 15% of the timer for your conclusion.",
    },
    {
      key: "camera-engagement", label: "Camera orientation", category: "visual", weight: 6, metric: scorecard.objective.cameraEngagement,
      strength: "You returned to a camera-facing orientation consistently.",
      title: "Return to the camera consistently",
      why: "The on-device orientation signal found opportunities to face the camera through transitions.",
      action: "Place the prompt near the camera and return there at the end of each thought.",
    },
    {
      key: "framing-presence", label: "Framing", category: "visual", weight: 3, metric: scorecard.objective.framingPresence,
      strength: "Your head-and-shoulders framing stayed stable during the recording.",
      title: "Stabilize your framing",
      why: "The on-device framing signal varied during the response.",
      action: "Set the camera at eye level and keep your head and shoulders inside the preview.",
    },
  ];

  const available = candidates.filter((item) => item.metric.available && item.metric.score !== null);
  const ranked = [...available].sort((a, b) => (a.metric.score ?? 0) - (b.metric.score ?? 0));
  const strongest = ranked.at(-1) ?? candidates[1]!;
  const priorities = ranked.length ? ranked : [candidates[1]!];
  const primary = priorities[0]!;
  const supporting = priorities[1] ?? priorities[0]!;
  const score = weightedScore(available) ?? scorecard.objective.duration.score ?? 0;
  const deliveryScore = weightedScore(available.filter((item) => item.category === "delivery"));
  const visualScore = weightedScore(available.filter((item) => item.category === "visual"));
  const visualConfidence = available.filter((item) => item.category === "visual").some((item) => item.metric.confidence === "medium") ? "Medium" : "Low";

  return {
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    prompt: input.config.prompt,
    mode: input.config.mode,
    durationSeconds: input.durationSeconds,
    targetSeconds: input.config.targetSeconds,
    score,
    status: "partial",
    isLocal: true,
    localMedia: input.localMedia,
    rubricVersion: "local-signals-1.0",
    previousScore: score,
    words: 0,
    wpm: null,
    fillerRate: null,
    cameraEngagement: scorecard.objective.cameraEngagement.value === undefined ? null : Math.round(scorecard.objective.cameraEngagement.value),
    strongest: strongest.label,
    priority: primary.title,
    summary: "This live objective score uses the duration, vocal-energy variation, and reliable camera signals measured from your recording. Transcript and semantic content are not estimated.",
    categories: [
      { key: "delivery", label: "Delivery mechanics", score: deliveryScore, delta: null, confidence: deliveryScore === null ? "Low" : "Medium", summary: deliveryScore === null ? "Not enough reliable audio signal was captured." : "Measured from vocal-energy variation and target timing." },
      { key: "fluency", label: "Fluency", score: null, delta: null, confidence: "Low", summary: "Transcript unavailable for this on-device result." },
      { key: "content", label: "Structure & content", score: null, delta: null, confidence: "Low", summary: "Semantic content is not estimated without transcription." },
      { key: "visual", label: "Visual presence", score: visualScore, delta: null, confidence: visualConfidence, summary: visualScore === null ? "Camera signal was unavailable or below the reliability threshold." : "Measured locally from camera-facing orientation and stable framing." },
      { key: "confidence", label: "Confident delivery", score: null, delta: null, confidence: "Low", summary: "Pulse does not infer internal confidence from camera or microphone data." },
    ],
    transcript: [{ id: "local-notice", start: 0, end: input.durationSeconds, text: "Transcript unavailable. This live result uses objective on-device audio and camera measurements only.", marks: [] }],
    timeline: [
      { time: 0, type: "capture", label: "On-device signal capture started", tone: "neutral" },
      { time: Math.max(0, Math.round(input.durationSeconds / 2)), type: strongest.key, label: `${strongest.label} · ${strongest.metric.score ?? "unavailable"}/100`, tone: "success" },
      { time: input.durationSeconds, type: "duration", label: `Target timing · ${scorecard.objective.duration.score ?? "unavailable"}/100`, tone: "neutral" },
    ],
    strengths: available.slice().sort((a, b) => (b.metric.score ?? 0) - (a.metric.score ?? 0)).slice(0, 3).map((item) => item.strength).concat(["Your recording was analyzed privately in this browser."]).slice(0, 3),
    recommendations: [
      { priority: "Primary", title: primary.title, why: primary.why, action: primary.action },
      { priority: "Supporting", title: supporting.title, why: supporting.why, action: supporting.action },
    ],
  };
}
