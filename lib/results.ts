import type { PracticeMode } from "@/lib/product";

export type SessionResultView = {
  id: string;
  createdAt: string;
  prompt: string;
  mode: PracticeMode;
  durationSeconds: number;
  targetSeconds: number;
  score: number | null;
  status: string;
  isSample?: boolean;
  isLocal?: boolean;
  localMedia?: { url: string; kind: "audio" | "video" };
  rubricVersion: string;
  previousScore: number;
  words: number;
  wpm: number | null;
  fillerRate: number | null;
  cameraEngagement: number | null;
  strongest: string;
  priority: string;
  summary: string;
  categories: { key: string; label: string; score: number | null; delta: number | null; confidence: "High" | "Medium" | "Low"; summary: string }[];
  transcript: { id: string; start: number; end: number; text: string; marks: string[] }[];
  timeline: { time: number; type: string; label: string; tone: "success" | "warning" | "neutral" }[];
  strengths: string[];
  recommendations: { priority: string; title: string; why: string; action: string }[];
};
