import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { evaluatorOutputSchema, type EvaluatorOutput } from "@/lib/ai/schema";
import { getServerEnv } from "@/lib/env";
import { formatDuration } from "@/lib/utils";

export const EVALUATOR_PROMPT_VERSION = "pulse-evaluator-1.0.0";
export const EVALUATOR_MODEL = "gpt-5.6-sol";

const EVALUATOR_INSTRUCTIONS = `You evaluate a single English public-speaking practice session for Pulse.

Return only the supplied structured schema. Judge the speaking performance, never the person.

Evidence rules:
- Use calculated metrics as facts. Never estimate WPM, filler counts, pause duration, gaze percentage, or recording duration.
- Every material judgment must cite a transcript, metric, or supplied frame timestamp.
- Transcript excerpts must be exact substrings of the supplied transcript.
- Frames are sparse samples, not continuous video. Never claim what happened between frames.
- If visual input is absent or inadequate, set visual dimensions to low confidence, explain why, and use no fabricated visual evidence.
- Camera engagement is an observable orientation proxy, not literal eye contact.
- Confident delivery means perceived commitment, composure, audibility, and completion of thoughts. Do not infer internal emotion or anxiety.
- Never judge accent conformity, attractiveness, personality, honesty, disability, culture, or identity.

Rubric anchors:
20 materially blocks comprehension or task success.
40 repeated weaknesses interfere despite partial success.
60 competent and understandable with specific opportunities.
80 strong and purposeful with minor bounded opportunities.
100 exceptional for the selected mode and duration with consistent evidence.

Keep recommendations specific, limited, and achievable in the next practice.`;

type EvaluateInput = {
  userId: string;
  prompt: string;
  mode: string;
  difficulty: string;
  targetSeconds: number;
  transcript: string;
  transcriptWithTimestamps: string;
  metrics: Record<string, string | number | null>;
  frames: { timestampMs: number; dataUrl: string }[];
};

export async function evaluateSession(input: EvaluateInput): Promise<EvaluatorOutput> {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const content: OpenAI.Responses.ResponseInputContent[] = [
    {
      type: "input_text",
      text: [
        `Mode: ${input.mode}`,
        `Difficulty: ${input.difficulty}`,
        `Target duration: ${input.targetSeconds} seconds`,
        `Prompt: ${input.prompt}`,
        `Calculated metrics: ${JSON.stringify(input.metrics)}`,
        `Timestamped transcript:\n${input.transcriptWithTimestamps}`,
        `Exact transcript for excerpt validation:\n${input.transcript}`,
      ].join("\n\n"),
    },
  ];
  for (const frame of input.frames) {
    content.push({ type: "input_text", text: `Sampled frame at ${formatDuration(frame.timestampMs / 1000)}. This is a discrete still image.` });
    content.push({ type: "input_image", detail: "low", image_url: frame.dataUrl });
  }
  const response = await openai.responses.parse({
    model: EVALUATOR_MODEL,
    instructions: EVALUATOR_INSTRUCTIONS,
    input: [{ role: "user", content }],
    text: { format: zodTextFormat(evaluatorOutputSchema, "pulse_session_evaluation") },
    reasoning: { effort: "low" },
    store: false,
    safety_identifier: `pulse_${input.userId}`,
  });
  if (!response.output_parsed) throw new Error("EVALUATOR_EMPTY_OUTPUT");
  return response.output_parsed;
}

export function validateEvaluatorEvidence(output: EvaluatorOutput, transcript: string, frameTimestamps: readonly number[]) {
  const normalizedTranscript = transcript.normalize("NFKC");
  const validFrames = new Set(frameTimestamps);
  const isValid = (evidence: EvaluatorOutput["dimensions"][number]["evidence"][number]) => {
    if (evidence.endMs < evidence.startMs) return false;
    if (evidence.source === "transcript") return Boolean(evidence.excerpt) && normalizedTranscript.includes(evidence.excerpt.normalize("NFKC"));
    if (evidence.source === "frame") return validFrames.has(evidence.startMs) && evidence.startMs === evidence.endMs;
    return true;
  };
  return {
    ...output,
    dimensions: output.dimensions.map((dimension) => ({ ...dimension, evidence: dimension.evidence.filter(isValid) })),
    strengths: output.strengths.map((item) => ({ ...item, evidence: item.evidence.filter(isValid) })).filter((item) => item.evidence.length > 0),
    recommendations: output.recommendations.map((item) => ({ ...item, evidence: item.evidence.filter(isValid) })),
  };
}
