import { describe, expect, it } from "vitest";
import { completeSessionSchema, createSessionSchema } from "./session";

const validSession = {
  config: { mode: "impromptu", category: "Everyday Life", difficulty: "intermediate", promptId: "imp-life-i", prompt: "Describe a useful change.", targetSeconds: 120, preparationSeconds: 30, videoEnabled: true },
  durationSeconds: 112,
  audio: { mime: "audio/webm", bytes: 120_000 },
  video: { mime: "video/webm", bytes: 2_000_000 },
  frameTimestamps: [5_000, 10_000],
};

describe("session boundary validation", () => {
  it("accepts an approved session configuration", () => {
    expect(createSessionSchema.safeParse(validSession).success).toBe(true);
  });

  it("rejects unsupported lengths and oversized media", () => {
    expect(createSessionSchema.safeParse({ ...validSession, config: { ...validSession.config, targetSeconds: 90 } }).success).toBe(false);
    expect(createSessionSchema.safeParse({ ...validSession, audio: { mime: "audio/webm", bytes: 30 * 1024 * 1024 } }).success).toBe(false);
  });

  it("caps frame and local-signal payloads", () => {
    const parsed = completeSessionSchema.safeParse({ durationSeconds: 60, audioSamples: [], visualSamples: [], frames: Array.from({ length: 49 }, (_, index) => ({ timestampMs: index * 1000, path: `frame-${index}.jpg` })) });
    expect(parsed.success).toBe(false);
  });
});
