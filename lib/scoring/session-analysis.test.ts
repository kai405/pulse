import { describe, expect, it } from "vitest";
import { scorePaceConsistency, scoreVisualRatio, scoreVocalVariation } from "./session-analysis";

describe("session scoring helpers", () => {
  it("scores stable 30-second pace windows", () => {
    const words = Array.from({ length: 140 }, (_, index) => ({ word: `w${index}`, start: index * (60 / 140), end: index * (60 / 140) + 0.2 }));
    expect(scorePaceConsistency(words).score).toBe(100);
  });

  it("withholds vocal variation with inadequate coverage", () => {
    expect(scoreVocalVariation([{ timestampMs: 0, rms: 0, clipping: false }]).available).toBe(false);
  });

  it("scores bounded RMS variation without comparing absolute pitch", () => {
    const samples = Array.from({ length: 100 }, (_, index) => ({ timestampMs: index * 100, rms: index % 2 ? 0.08 : 0.04, clipping: false }));
    expect(scoreVocalVariation(samples).score).not.toBeNull();
  });

  it("scores observable camera orientation from reliable local samples", () => {
    const samples = Array.from({ length: 20 }, (_, index) => ({ timestampMs: index * 250, faceDetected: true, cameraEngaged: index < 18, wellFramed: true, confidence: "medium" as const }));
    expect(scoreVisualRatio(samples, "camera-engagement")).toMatchObject({ score: 100, confidence: "medium", available: true });
  });

  it("withholds visual scoring when face coverage is inadequate", () => {
    const samples = Array.from({ length: 10 }, (_, index) => ({ timestampMs: index * 250, faceDetected: index < 3, cameraEngaged: false, wellFramed: false, confidence: "low" as const }));
    expect(scoreVisualRatio(samples, "framing-presence").available).toBe(false);
  });
});
