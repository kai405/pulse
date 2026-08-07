import { clamp } from "@/lib/utils";
import { normalizeToken, tokenize } from "./tokenize";
import type {
  AggregateScore,
  MetricScore,
  Pause,
  TriggerMatch,
  WeightedScore,
  WordTiming,
} from "./types";

export const DEFAULT_FILLERS = [
  "you know",
  "I mean",
  "basically",
  "actually",
  "literally",
  "sort of",
  "kind of",
  "um",
  "uh",
  "erm",
  "er",
  "ah",
] as const;

export function calculateWpm(totalWords: number, speakingSeconds: number) {
  if (totalWords < 20 || speakingSeconds < 10) return null;
  return (totalWords / speakingSeconds) * 60;
}

export function scorePace(wpm: number | null, targetWpm: number): MetricScore {
  if (wpm === null || !Number.isFinite(targetWpm) || targetWpm <= 0) {
    return unavailable("pace", "Not enough reliable speech to calculate pace.");
  }
  const difference = Math.abs(wpm - targetWpm) / targetWpm;
  const score = difference <= 0.05 ? 100 : difference <= 0.1 ? 85 : difference <= 0.2 ? 70 : difference <= 0.3 ? 50 : 25;
  return available("pace", score, wpm, "wpm");
}

export function scoreDuration(actualSeconds: number, targetSeconds: number): MetricScore {
  if (actualSeconds <= 0 || targetSeconds <= 0) return unavailable("duration", "Duration is unavailable.");
  const ratio = actualSeconds / targetSeconds;
  const score = ratio >= 0.9 && ratio <= 1.1 ? 100 : ratio >= 0.8 && ratio <= 1.2 ? 80 : ratio >= 0.7 && ratio <= 1.3 ? 60 : 35;
  return available("duration", score, ratio * 100, "% of target");
}

export function findFillers(text: string, fillers: readonly string[] = DEFAULT_FILLERS) {
  const tokens = tokenize(text);
  const phrases = fillers
    .map((phrase) => ({ phrase, tokens: tokenize(phrase) }))
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const matches: { phrase: string; tokenIndex: number; tokenLength: number }[] = [];
  const claimed = new Set<number>();
  for (let index = 0; index < tokens.length; index += 1) {
    for (const candidate of phrases) {
      const candidateTokens = tokens.slice(index, index + candidate.tokens.length);
      if (
        candidateTokens.length === candidate.tokens.length &&
        candidateTokens.every((token, offset) => token === candidate.tokens[offset]) &&
        candidateTokens.every((_, offset) => !claimed.has(index + offset))
      ) {
        matches.push({ phrase: candidate.phrase.toLocaleLowerCase("en-US"), tokenIndex: index, tokenLength: candidate.tokens.length });
        candidateTokens.forEach((_, offset) => claimed.add(index + offset));
        break;
      }
    }
  }
  return matches;
}

export function scoreFillerRate(count: number, speakingSeconds: number): MetricScore {
  if (speakingSeconds < 10) return unavailable("fillers", "Recording is too short to calculate a filler rate.");
  const rate = count / (speakingSeconds / 60);
  const score = rate <= 1 ? 100 : rate <= 2 ? 85 : rate <= 4 ? 65 : rate <= 6 ? 45 : 25;
  return available("fillers", score, rate, "per minute");
}

export function calculatePauses(words: readonly WordTiming[]): Pause[] {
  const pauses: Pause[] = [];
  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1];
    const current = words[index];
    if (!previous || !current) continue;
    const duration = current.start - previous.end;
    if (duration < 0.35) continue;
    pauses.push({
      start: previous.end,
      end: current.start,
      duration,
      kind: duration < 0.75 ? "short" : duration < 2.5 ? "intentional" : "long",
    });
  }
  return pauses;
}

export function scorePauseRhythm(pauses: readonly Pause[], totalWords: number) {
  if (totalWords < 50) return unavailable("pause-rhythm", "At least 50 words are required to score pause rhythm.");
  const longCount = pauses.filter((pause) => pause.kind === "long").length;
  const pauseRate = pauses.length / (totalWords / 100);
  const score = clamp(100 - Math.min(40, longCount * 10) - (pauseRate < 2 ? 20 : 0), 25, 100);
  return available("pause-rhythm", score, pauseRate, "per 100 words");
}

export function findTriggerWords(words: readonly WordTiming[], triggers: readonly string[]): TriggerMatch[] {
  const normalizedWords = words.map((entry) => normalizeToken(entry.word));
  const candidates = triggers
    .map((phrase) => ({ phrase, tokens: tokenize(phrase) }))
    .filter((candidate) => candidate.tokens.length > 0)
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const claimed = new Set<number>();
  const matches: TriggerMatch[] = [];
  for (let index = 0; index < normalizedWords.length; index += 1) {
    for (const candidate of candidates) {
      const slice = normalizedWords.slice(index, index + candidate.tokens.length);
      if (
        slice.length === candidate.tokens.length &&
        slice.every((token, offset) => token === candidate.tokens[offset]) &&
        slice.every((_, offset) => !claimed.has(index + offset))
      ) {
        const first = words[index];
        const last = words[index + candidate.tokens.length - 1];
        if (first && last) {
          matches.push({ phrase: candidate.phrase, start: first.start, end: last.end });
          slice.forEach((_, offset) => claimed.add(index + offset));
        }
        break;
      }
    }
  }
  return matches;
}

export function findImmediateRepetitions(words: readonly WordTiming[]) {
  const repeats: { word: string; start: number; end: number }[] = [];
  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1];
    const current = words[index];
    if (!previous || !current) continue;
    const normalized = normalizeToken(current.word);
    if (normalized.length > 1 && normalized === normalizeToken(previous.word)) {
      repeats.push({ word: normalized, start: previous.start, end: current.end });
    }
  }
  return repeats;
}

export function findRepeatedPhrases(words: readonly WordTiming[]) {
  const normalized = words.map((word) => normalizeToken(word.word));
  const stopWords = new Set(["a", "an", "and", "as", "at", "for", "in", "is", "of", "on", "or", "the", "to", "with"]);
  const candidates: { phrase: string; size: number; positions: number[] }[] = [];
  for (let size = 5; size >= 3; size -= 1) {
    const positionsByPhrase = new Map<string, number[]>();
    for (let index = 0; index <= normalized.length - size; index += 1) {
      const tokens = normalized.slice(index, index + size);
      if (tokens.some((token) => !token) || tokens.every((token) => stopWords.has(token))) continue;
      const phrase = tokens.join(" ");
      positionsByPhrase.set(phrase, [...(positionsByPhrase.get(phrase) ?? []), index]);
    }
    for (const [phrase, positions] of positionsByPhrase) {
      const nonOverlapping = positions.filter((position, index) => index === 0 || position - positions[index - 1]! >= size);
      if (nonOverlapping.length >= 2) candidates.push({ phrase, size, positions: nonOverlapping });
    }
  }
  const claimed = new Set<number>();
  return candidates.flatMap((candidate) => {
    const fresh = candidate.positions.filter((position) => !Array.from({ length: candidate.size }, (_, offset) => claimed.has(position + offset)).some(Boolean));
    if (fresh.length < 2) return [];
    fresh.forEach((position) => Array.from({ length: candidate.size }, (_, offset) => claimed.add(position + offset)));
    return [{
      phrase: candidate.phrase,
      count: fresh.length,
      occurrences: fresh.map((position) => ({ start: words[position]?.start ?? 0, end: words[position + candidate.size - 1]?.end ?? 0 })),
    }];
  });
}

export function scoreRepetition(immediateCount: number, repeatedPhraseCount: number) {
  return available("repetition", clamp(100 - Math.min(32, immediateCount * 8) - Math.min(40, repeatedPhraseCount * 10), 25, 100), immediateCount + repeatedPhraseCount, "events");
}

export function aggregateScores(metrics: readonly WeightedScore[], minimumAvailableRatio = 0.5): AggregateScore {
  const configuredWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
  const availableMetrics = metrics.filter(
    (metric) => metric.available && metric.score !== null && metric.confidence !== "low",
  );
  const availableWeight = availableMetrics.reduce((sum, metric) => sum + metric.weight, 0);
  const omitted = metrics.filter((metric) => !availableMetrics.includes(metric)).map((metric) => metric.key);
  if (configuredWeight <= 0 || availableWeight / configuredWeight < minimumAvailableRatio) {
    return { score: null, availableWeight, configuredWeight, omitted };
  }
  const weighted = availableMetrics.reduce((sum, metric) => sum + (metric.score ?? 0) * metric.weight, 0);
  return { score: Math.round(weighted / availableWeight), availableWeight, configuredWeight, omitted };
}

function available(key: string, score: number, value: number, unit: string): MetricScore {
  return { key, score, available: true, confidence: "high", value, unit };
}

function unavailable(key: string, reason: string): MetricScore {
  return { key, score: null, available: false, confidence: "low", reason };
}
