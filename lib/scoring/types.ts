export type Confidence = "high" | "medium" | "low";

export type WordTiming = {
  word: string;
  start: number;
  end: number;
  confidence?: number;
};

export type EvidenceRange = {
  startMs: number;
  endMs: number;
  label: string;
};

export type MetricScore = {
  key: string;
  score: number | null;
  available: boolean;
  confidence: Confidence;
  value?: number;
  unit?: string;
  reason?: string;
  evidence?: EvidenceRange[];
};

export type WeightedScore = MetricScore & { weight: number };

export type AggregateScore = {
  score: number | null;
  availableWeight: number;
  configuredWeight: number;
  omitted: string[];
};

export type Pause = {
  start: number;
  end: number;
  duration: number;
  kind: "short" | "intentional" | "long";
};

export type TriggerMatch = {
  phrase: string;
  start: number;
  end: number;
};
