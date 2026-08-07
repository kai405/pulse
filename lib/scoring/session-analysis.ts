import type { DimensionEvaluation } from "@/lib/ai/schema";
import { aggregateScores, calculatePauses, calculateWpm, findFillers, findImmediateRepetitions, findRepeatedPhrases, findTriggerWords, scoreDuration, scoreFillerRate, scorePace, scorePauseRhythm, scoreRepetition } from "@/lib/scoring/metrics";
import type { MetricScore, WeightedScore, WordTiming } from "@/lib/scoring/types";
import { clamp } from "@/lib/utils";

export const THRESHOLD_SNAPSHOT = {
  version: "pulse-1.0.0",
  paceDifferenceBands: [0.05, 0.1, 0.2, 0.3],
  fillerRateBands: [1, 2, 4, 6],
  durationRatioBands: [[0.9, 1.1], [0.8, 1.2], [0.7, 1.3]],
  longPauseSeconds: 2.5,
  minimumWords: 20,
  minimumSpeakingSeconds: 10,
} as const;

export type AudioSample = { timestampMs: number; rms: number; clipping: boolean };
export type VisualSample = { timestampMs: number; faceDetected: boolean; cameraEngaged: boolean; wellFramed: boolean; confidence: "medium" | "low" };

export function scorePaceConsistency(words: readonly WordTiming[]): MetricScore {
  if (words.length < 20) return unavailable("pace-consistency", "Not enough words for multiple pace windows.");
  const end = words.at(-1)?.end ?? 0;
  const windows: number[] = [];
  for (let start = 0; start < end; start += 30) {
    const length = Math.min(30, end - start);
    if (length < 15) continue;
    const count = words.filter((word) => ((word.start + word.end) / 2) >= start && ((word.start + word.end) / 2) < start + length).length;
    windows.push((count / length) * 60);
  }
  if (windows.length < 2) return unavailable("pace-consistency", "At least two valid pace windows are required.");
  const mean = windows.reduce((sum, value) => sum + value, 0) / windows.length;
  const standardDeviation = Math.sqrt(windows.reduce((sum, value) => sum + (value - mean) ** 2, 0) / windows.length);
  const coefficient = mean > 0 ? standardDeviation / mean : 1;
  const score = coefficient <= 0.12 ? 100 : coefficient <= 0.2 ? 85 : coefficient <= 0.3 ? 70 : coefficient <= 0.45 ? 50 : 25;
  return available("pace-consistency", score, coefficient, "coefficient of variation");
}

export function scoreVocalVariation(samples: readonly AudioSample[]): MetricScore {
  const voiced = samples.filter((sample) => sample.rms >= 0.01 && !sample.clipping);
  if (voiced.length < 50 || voiced.length / Math.max(1, samples.length) < 0.5) return unavailable("vocal-variation", "Audio coverage was insufficient for reliable vocal variation.");
  const mean = voiced.reduce((sum, sample) => sum + sample.rms, 0) / voiced.length;
  const deviation = Math.sqrt(voiced.reduce((sum, sample) => sum + (sample.rms - mean) ** 2, 0) / voiced.length);
  const coefficient = mean > 0 ? deviation / mean : 0;
  const score = coefficient >= 0.25 && coefficient <= 0.55 ? 100 : coefficient >= 0.15 && coefficient <= 0.75 ? 85 : coefficient >= 0.1 && coefficient <= 0.9 ? 65 : 45;
  return { ...available("vocal-variation", score, coefficient, "normalized RMS variation"), confidence: "medium" };
}

export function scoreVisualRatio(samples: readonly VisualSample[], key: "camera-engagement" | "framing-presence"): MetricScore {
  const detected = samples.filter((sample) => sample.faceDetected);
  if (samples.length < 8 || detected.length / samples.length < 0.5) return unavailable(key, "A face was not detected consistently enough for a reliable local measurement.");
  const passing = detected.filter((sample) => key === "camera-engagement" ? sample.cameraEngaged : sample.wellFramed).length;
  const ratio = passing / detected.length;
  const score = ratio >= 0.85 ? 100 : ratio >= 0.7 ? 85 : ratio >= 0.5 ? 65 : ratio >= 0.3 ? 45 : 25;
  return { ...available(key, score, ratio * 100, "% of detected samples"), confidence: "medium" };
}

function semanticMetric(key: string, evaluation: DimensionEvaluation | undefined): MetricScore {
  if (!evaluation || evaluation.confidence === "low") return unavailable(key, evaluation?.unableReason || "The evaluator could not assess this dimension reliably.");
  return { key, score: evaluation.score, available: true, confidence: evaluation.confidence };
}

export function buildScorecard(input: {
  transcript: string;
  words: readonly WordTiming[];
  targetWpm: number;
  recordingSeconds: number;
  targetSeconds: number;
  audioSamples: readonly AudioSample[];
  visualSamples: readonly VisualSample[];
  triggerWords: readonly string[];
  dimensions: readonly DimensionEvaluation[];
  hasFrames: boolean;
}) {
  const speakingSeconds = input.words.length ? Math.max(0, (input.words.at(-1)?.end ?? 0) - (input.words[0]?.start ?? 0)) : 0;
  const wpm = calculateWpm(input.words.length, speakingSeconds);
  const fillers = findFillers(input.transcript);
  const pauses = calculatePauses(input.words);
  const repetitions = findImmediateRepetitions(input.words);
  const repeatedPhrases = findRepeatedPhrases(input.words);
  const triggerMatches = findTriggerWords(input.words, input.triggerWords);
  const dimension = (key: DimensionEvaluation["key"]) => input.dimensions.find((item) => item.key === key);
  const objective = {
    pace: scorePace(wpm, input.targetWpm),
    paceConsistency: scorePaceConsistency(input.words),
    pauseRhythm: { ...scorePauseRhythm(pauses, input.words.length), evidence: pauses.map((pause) => ({ startMs: Math.round(pause.start * 1000), endMs: Math.round(pause.end * 1000), label: `${pause.kind} pause` })) },
    vocalVariation: scoreVocalVariation(input.audioSamples),
    duration: scoreDuration(input.recordingSeconds, input.targetSeconds),
    fillerRate: { ...scoreFillerRate(fillers.length, speakingSeconds), evidence: fillers.flatMap((match) => { const first = input.words[match.tokenIndex]; const last = input.words[match.tokenIndex + match.tokenLength - 1]; return first && last ? [{ startMs: Math.round(first.start * 1000), endMs: Math.round(last.end * 1000), label: `Filler: ${match.phrase}` }] : []; }) },
    repetition: { ...scoreRepetition(repetitions.length, repeatedPhrases.reduce((sum, phrase) => sum + phrase.count - 1, 0)), evidence: [...repetitions.map((match) => ({ startMs: Math.round(match.start * 1000), endMs: Math.round(match.end * 1000), label: `Repeated word: ${match.word}` })), ...repeatedPhrases.flatMap((phrase) => phrase.occurrences.map((match) => ({ startMs: Math.round(match.start * 1000), endMs: Math.round(match.end * 1000), label: `Repeated phrase: ${phrase.phrase}` })))] },
    cameraEngagement: scoreVisualRatio(input.visualSamples, "camera-engagement"),
    framingPresence: scoreVisualRatio(input.visualSamples, "framing-presence"),
  };
  const metric = (key: DimensionEvaluation["key"]) => semanticMetric(key, dimension(key));
  const category = (items: WeightedScore[]) => aggregateScores(items);
  const delivery = category([
    { ...objective.pace, weight: 6 }, { ...objective.paceConsistency, weight: 4 }, { ...objective.pauseRhythm, weight: 5 }, { ...objective.vocalVariation, weight: 5 }, { ...objective.duration, weight: 5 },
  ]);
  const fluency = category([
    { ...objective.fillerRate, weight: 7 }, { ...objective.repetition, weight: 5 }, { ...metric("verbal_clarity"), weight: 5 }, { ...metric("sentence_flow"), weight: 3 },
  ]);
  const content = category([
    { ...metric("organization"), weight: 7 }, { ...metric("clarity_of_ideas"), weight: 6 }, { ...metric("conciseness"), weight: 5 }, { ...metric("relevance"), weight: 4 }, { ...metric("opening"), weight: 4 }, { ...metric("conclusion"), weight: 4 },
  ]);
  const visual = input.hasFrames ? category([
    { ...objective.cameraEngagement, weight: 6 }, { ...objective.framingPresence, weight: 3 }, { ...metric("facial_engagement"), weight: 3 }, { ...metric("purposeful_movement"), weight: 3 },
  ]) : { score: null, availableWeight: 0, configuredWeight: 15, omitted: ["camera_engagement", "framing_presence", "facial_engagement", "purposeful_movement"] };
  const confidence = category([{ ...metric("confident_delivery"), weight: 10 }]);
  const categoryScores = { delivery, fluency, content, visual, confidence };
  const overall = content.score === null ? { score: null, availableWeight: 0, configuredWeight: 100, omitted: ["content-required"] } : aggregateScores([
    aggregateAsMetric("delivery", delivery.score, 25), aggregateAsMetric("fluency", fluency.score, 20), aggregateAsMetric("content", content.score, 30), aggregateAsMetric("visual", visual.score, 15), aggregateAsMetric("confidence", confidence.score, 10),
  ]);
  return { overall, categoryScores, objective, fillers, pauses, repetitions, repeatedPhrases, triggerMatches, speakingSeconds, wpm };
}

function aggregateAsMetric(key: string, score: number | null, weight: number): WeightedScore {
  return { key, score, weight, available: score !== null, confidence: score === null ? "low" : "high", reason: score === null ? "Category unavailable." : undefined };
}

function available(key: string, score: number, value: number, unit: string): MetricScore {
  return { key, score: clamp(score), available: true, confidence: "high", value, unit };
}

function unavailable(key: string, reason: string): MetricScore {
  return { key, score: null, available: false, confidence: "low", reason };
}
