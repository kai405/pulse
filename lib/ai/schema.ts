import { z } from "zod";

export const evidenceSchema = z.object({
  source: z.enum(["transcript", "frame", "metric"]),
  startMs: z.int().min(0),
  endMs: z.int().min(0),
  excerpt: z.string().max(240),
  explanation: z.string().min(1).max(400),
});

export const dimensionKeySchema = z.enum([
  "verbal_clarity",
  "sentence_flow",
  "organization",
  "clarity_of_ideas",
  "conciseness",
  "relevance",
  "opening",
  "conclusion",
  "camera_engagement",
  "framing_presence",
  "facial_engagement",
  "purposeful_movement",
  "confident_delivery",
]);

export const dimensionEvaluationSchema = z.object({
  key: dimensionKeySchema,
  score: z.union([z.literal(20), z.literal(40), z.literal(60), z.literal(80), z.literal(100)]),
  confidence: z.enum(["high", "medium", "low"]),
  explanation: z.string().min(1).max(600),
  evidence: z.array(evidenceSchema).max(3),
  strength: z.string().min(1).max(300),
  weakness: z.string().min(1).max(300),
  recommendation: z.string().min(1).max(500),
  unableReason: z.string().max(300),
});

export const evaluatorOutputSchema = z.object({
  summary: z.string().min(1).max(900),
  strongestDimension: dimensionKeySchema,
  priorityImprovement: z.string().min(1).max(300),
  nextAction: z.string().min(1).max(500),
  dimensions: z.array(dimensionEvaluationSchema).length(13),
  strengths: z.array(z.object({ title: z.string().min(1).max(120), explanation: z.string().min(1).max(400), evidence: z.array(evidenceSchema).min(1).max(2) })).min(1).max(3),
  recommendations: z.array(z.object({ title: z.string().min(1).max(120), why: z.string().min(1).max(400), action: z.string().min(1).max(500), evidence: z.array(evidenceSchema).min(1).max(2) })).length(2),
  limitations: z.array(z.string().min(1).max(300)).max(5),
});

export type EvaluatorOutput = z.infer<typeof evaluatorOutputSchema>;
export type DimensionEvaluation = z.infer<typeof dimensionEvaluationSchema>;
