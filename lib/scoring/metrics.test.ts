import { describe, expect, it } from "vitest";
import {
  aggregateScores,
  calculatePauses,
  calculateWpm,
  findFillers,
  findImmediateRepetitions,
  findRepeatedPhrases,
  findTriggerWords,
  scoreDuration,
  scoreFillerRate,
  scorePace,
} from "./metrics";
import { countWords, tokenize } from "./tokenize";

describe("scoring metrics", () => {
  it("calculates WPM and rejects insufficient speech", () => {
    expect(calculateWpm(140, 60)).toBe(140);
    expect(calculateWpm(70, 30)).toBe(140);
    expect(calculateWpm(15, 30)).toBeNull();
  });

  it("normalizes words without splitting internal apostrophes", () => {
    expect(tokenize("We’re user-focused—and clear.")).toEqual(["we're", "user-focused", "and", "clear"]);
    expect(countWords("Hello, world! 42 times.")).toBe(4);
  });

  it("scores pace and duration at documented bands", () => {
    expect(scorePace(140, 140).score).toBe(100);
    expect(scorePace(168, 140).score).toBe(70);
    expect(scoreDuration(108, 120).score).toBe(100);
    expect(scoreDuration(60, 120).score).toBe(35);
  });

  it("matches longest filler phrases without double counting", () => {
    const matches = findFillers("Um, you know, I mean this basically works.");
    expect(matches.map((match) => match.phrase)).toEqual(["um", "you know", "i mean", "basically"]);
    expect(scoreFillerRate(3, 60).score).toBe(65);
  });

  it("calculates pauses from adjacent word timings", () => {
    const pauses = calculatePauses([
      { word: "one", start: 0, end: 0.2 },
      { word: "two", start: 0.8, end: 1 },
      { word: "three", start: 4, end: 4.3 },
    ]);
    expect(pauses).toEqual([
      { start: 0.2, end: 0.8, duration: 0.6000000000000001, kind: "short" },
      { start: 1, end: 4, duration: 3, kind: "long" },
    ]);
  });

  it("detects trigger phrases with longest-match behavior", () => {
    const words = [
      { word: "At", start: 0, end: 0.2 },
      { word: "the", start: 0.2, end: 0.4 },
      { word: "end", start: 0.4, end: 0.7 },
    ];
    expect(findTriggerWords(words, ["end", "the end"])).toEqual([{ phrase: "the end", start: 0.2, end: 0.7 }]);
  });

  it("detects immediate repetition", () => {
    expect(findImmediateRepetitions([
      { word: "We", start: 0, end: 0.2 },
      { word: "we", start: 0.3, end: 0.5 },
      { word: "improve", start: 0.6, end: 1 },
    ])).toHaveLength(1);
  });

  it("detects a repeated phrase without duplicating its shorter n-grams", () => {
    const words = "we can make this work today and we can make this work tomorrow".split(" ").map((word, index) => ({ word, start: index * 0.4, end: index * 0.4 + 0.3 }));
    const matches = findRepeatedPhrases(words);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ phrase: "we can make this work", count: 2 });
  });

  it("omits low confidence and reweights remaining scores", () => {
    const aggregate = aggregateScores([
      { key: "delivery", score: 80, weight: 25, available: true, confidence: "high" },
      { key: "content", score: 100, weight: 30, available: true, confidence: "high" },
      { key: "visual", score: 20, weight: 15, available: true, confidence: "low" },
    ]);
    expect(aggregate.score).toBe(91);
    expect(aggregate.omitted).toEqual(["visual"]);
  });

  it("withholds aggregates with insufficient available weight", () => {
    expect(aggregateScores([
      { key: "delivery", score: 80, weight: 25, available: true, confidence: "high" },
      { key: "content", score: null, weight: 75, available: false, confidence: "low" },
    ]).score).toBeNull();
  });
});
