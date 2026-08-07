import { describe, expect, it } from "vitest";
import { validateEvaluatorEvidence } from "./evaluator";
import type { EvaluatorOutput } from "./schema";

const dimensionKeys = ["verbal_clarity", "sentence_flow", "organization", "clarity_of_ideas", "conciseness", "relevance", "opening", "conclusion", "camera_engagement", "framing_presence", "facial_engagement", "purposeful_movement", "confident_delivery"] as const;

function fixture(): EvaluatorOutput {
  const evidence = [{ source: "transcript" as const, startMs: 0, endMs: 1000, excerpt: "Exact evidence", explanation: "Supports the claim." }];
  return {
    summary: "A grounded summary.", strongestDimension: "organization", priorityImprovement: "Pause deliberately.", nextAction: "Repeat once.", limitations: [],
    dimensions: dimensionKeys.map((key) => ({ key, score: 60, confidence: "high", explanation: "Clear.", evidence, strength: "Specific.", weakness: "Bounded.", recommendation: "Practice.", unableReason: "" })),
    strengths: [{ title: "Clear", explanation: "It worked.", evidence }],
    recommendations: [{ title: "Pause", why: "It matters.", action: "Practice.", evidence }, { title: "Look up", why: "It matters.", action: "Practice.", evidence }],
  };
}

describe("evaluator evidence validation", () => {
  it("keeps exact transcript excerpts", () => {
    expect(validateEvaluatorEvidence(fixture(), "Exact evidence appears here.", []).dimensions[0]?.evidence).toHaveLength(1);
  });

  it("drops unsupported transcript excerpts", () => {
    expect(validateEvaluatorEvidence(fixture(), "Different words.", []).dimensions[0]?.evidence).toHaveLength(0);
  });

  it("accepts only known exact frame timestamps", () => {
    const output = fixture();
    output.dimensions[0]!.evidence = [{ source: "frame", startMs: 5000, endMs: 5000, excerpt: "Frame 5", explanation: "Visible." }];
    expect(validateEvaluatorEvidence(output, "", [5000]).dimensions[0]?.evidence).toHaveLength(1);
    expect(validateEvaluatorEvidence(output, "", [6000]).dimensions[0]?.evidence).toHaveLength(0);
  });
});
