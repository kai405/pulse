export const PRACTICE_MODES = [
  "impromptu",
  "interview",
  "presentation",
  "elevator-pitch",
] as const;

export type PracticeMode = (typeof PRACTICE_MODES)[number];

export const MODE_LABELS: Record<PracticeMode, string> = {
  impromptu: "Impromptu",
  interview: "Interview",
  presentation: "Presentation",
  "elevator-pitch": "Elevator pitch",
};

export const TOPIC_CATEGORIES = [
  "Work and Leadership",
  "Personal Stories",
  "Ideas and Opinions",
  "Everyday Life",
  "Creative and Playful",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const TARGET_DURATIONS = [60, 120, 180, 300] as const;
export const PREPARATION_DURATIONS = [0, 15, 30, 60] as const;
export const DEFAULT_TARGET_WPM = 140;
export const RUBRIC_VERSION = "pulse-1.0.0";
