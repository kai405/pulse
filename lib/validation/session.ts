import { z } from "zod";
import { DIFFICULTIES, PRACTICE_MODES } from "@/lib/product";

export const practiceConfigurationSchema = z.object({
  mode: z.enum(PRACTICE_MODES),
  category: z.string().min(1).max(80),
  difficulty: z.enum(DIFFICULTIES),
  promptId: z.string().max(80).nullable(),
  prompt: z.string().trim().min(1).max(1000),
  targetSeconds: z.union([z.literal(60), z.literal(120), z.literal(180), z.literal(300)]),
  preparationSeconds: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(60)]),
  videoEnabled: z.boolean(),
  focus: z.string().max(80).optional(),
});

export const createSessionSchema = z.object({
  config: practiceConfigurationSchema,
  durationSeconds: z.number().min(0).max(600),
  audio: z.object({ mime: z.enum(["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/mpeg", "audio/wav"]), bytes: z.int().positive().max(25 * 1024 * 1024) }),
  video: z.object({ mime: z.enum(["video/webm", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/mp4"]), bytes: z.int().positive().max(150 * 1024 * 1024) }).nullable(),
  frameTimestamps: z.array(z.int().min(0).max(600_000)).max(48),
});

export const completeSessionSchema = z.object({
  durationSeconds: z.number().min(0).max(600),
  audioSamples: z.array(z.object({ timestampMs: z.number().min(0).max(600_000), rms: z.number().min(0).max(1), clipping: z.boolean() })).max(12_000),
  visualSamples: z.array(z.object({
    timestampMs: z.number().min(0).max(600_000),
    faceDetected: z.boolean(),
    cameraEngaged: z.boolean(),
    wellFramed: z.boolean(),
    confidence: z.enum(["medium", "low"]),
  })).max(3_000),
  frames: z.array(z.object({ timestampMs: z.int().min(0).max(600_000), path: z.string().min(1).max(500) })).max(48),
});
