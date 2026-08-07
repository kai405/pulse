import type { PracticeMode } from "@/lib/product";
import type { SessionResultView } from "@/lib/results";

export type SessionStatus = "completed" | "partial" | "processing" | "incomplete" | "failed";

export type SessionSummary = {
  id: string;
  createdAt: string;
  prompt: string;
  mode: PracticeMode;
  durationSeconds: number;
  targetSeconds: number;
  score: number | null;
  status: SessionStatus;
  isSample?: boolean;
};

export const SAMPLE_SESSIONS: SessionSummary[] = [
  {
    id: "sample-community-change",
    createdAt: "2026-08-04T18:30:00-04:00",
    prompt: "Describe one change that would improve your community and persuade others to support it.",
    mode: "impromptu",
    durationSeconds: 114,
    targetSeconds: 120,
    score: 82,
    status: "completed",
    isSample: true,
  },
  {
    id: "sample-leadership",
    createdAt: "2026-08-02T09:20:00-04:00",
    prompt: "Tell me about a time you helped a team move through uncertainty.",
    mode: "interview",
    durationSeconds: 103,
    targetSeconds: 120,
    score: 76,
    status: "completed",
    isSample: true,
  },
  {
    id: "sample-product-pitch",
    createdAt: "2026-07-30T16:10:00-04:00",
    prompt: "Pitch a product that helps neighbors share useful skills.",
    mode: "elevator-pitch",
    durationSeconds: 61,
    targetSeconds: 60,
    score: 73,
    status: "completed",
    isSample: true,
  },
  {
    id: "sample-learning",
    createdAt: "2026-07-27T11:00:00-04:00",
    prompt: "Explain a difficult skill you learned and what finally made it click.",
    mode: "impromptu",
    durationSeconds: 126,
    targetSeconds: 120,
    score: 71,
    status: "completed",
    isSample: true,
  },
  {
    id: "sample-remote-work",
    createdAt: "2026-07-24T17:40:00-04:00",
    prompt: "Present a proposal for improving communication on a remote team.",
    mode: "presentation",
    durationSeconds: 172,
    targetSeconds: 180,
    score: 69,
    status: "completed",
    isSample: true,
  },
  {
    id: "sample-curiosity",
    createdAt: "2026-07-20T13:15:00-04:00",
    prompt: "What is something ordinary that becomes fascinating when you look closely?",
    mode: "impromptu",
    durationSeconds: 107,
    targetSeconds: 120,
    score: 66,
    status: "completed",
    isSample: true,
  },
];

export const PROGRESS_SERIES = [
  { label: "Jul 20", score: 66, pace: 126, fillers: 4.8, engagement: 64 },
  { label: "Jul 24", score: 69, pace: 131, fillers: 4.1, engagement: 67 },
  { label: "Jul 27", score: 71, pace: 147, fillers: 3.5, engagement: 69 },
  { label: "Jul 30", score: 73, pace: 151, fillers: 3.2, engagement: 72 },
  { label: "Aug 2", score: 76, pace: 145, fillers: 2.8, engagement: 76 },
  { label: "Aug 4", score: 82, pace: 142, fillers: 2.1, engagement: 84 },
];

export const SAMPLE_RESULT: SessionResultView = {
  ...SAMPLE_SESSIONS[0]!,
  rubricVersion: "pulse-1.0.0",
  previousScore: 76,
  words: 270,
  wpm: 142,
  fillerRate: 2.1,
  cameraEngagement: 84,
  strongest: "Structure and content",
  priority: "Replace restart phrases with a deliberate pause",
  summary:
    "You gave the idea a clear problem-to-solution arc and ended with a concrete invitation. Your biggest opportunity is fluency: three restart phrases arrived when you were searching for the next point.",
  categories: [
    { key: "delivery", label: "Delivery mechanics", score: 84, delta: 5, confidence: "High", summary: "Pace stayed near your 140 WPM target, with useful pauses around the central example." },
    { key: "fluency", label: "Fluency", score: 68, delta: 3, confidence: "High", summary: "Five fillers and three restarts interrupted otherwise clear phrasing." },
    { key: "content", label: "Structure & content", score: 89, delta: 8, confidence: "High", summary: "A clear local problem, practical proposal, and direct close made the argument easy to follow." },
    { key: "visual", label: "Visual presence", score: 81, delta: 7, confidence: "Medium", summary: "Camera engagement was strong; two brief downward looks occurred while transitioning ideas." },
    { key: "confidence", label: "Confident delivery", score: 80, delta: 4, confidence: "Medium", summary: "Your commitment was audible and composed, though restarts softened two key claims." },
  ],
  transcript: [
    { id: "t1", start: 0, end: 12.4, text: "Most people on my block want to know their neighbors, but we usually meet only when something goes wrong.", marks: [] },
    { id: "t2", start: 12.4, end: 27.8, text: "I would create a monthly skill-share evening at the library, where one neighbor teaches something practical in twenty minutes.", marks: [] },
    { id: "t3", start: 27.8, end: 43.1, text: "Um, it could be bicycle repair, help with a résumé, or even how to grow herbs on a small balcony.", marks: ["Um"] },
    { id: "t4", start: 43.1, end: 58.7, text: "The point is not another event to attend. The point is giving people a reason to rely on one another before there is an emergency.", marks: [] },
    { id: "t5", start: 58.7, end: 74.2, text: "I think, I think we could start with six volunteers and a room the library already offers for free.", marks: ["I think, I think"] },
    { id: "t6", start: 74.2, end: 89.5, text: "You know, after three months we would ask participants which skills they used and whether they met someone new.", marks: ["You know"] },
    { id: "t7", start: 89.5, end: 103.3, text: "If it works, local shops could sponsor materials without turning the evening into an advertisement.", marks: [] },
    { id: "t8", start: 103.3, end: 114, text: "Give me one evening, six neighbors, and one library room, and we can make the block feel smaller in the best possible way.", marks: [] },
  ],
  timeline: [
    { time: 31, type: "filler", label: "Filler · “Um”", tone: "warning" },
    { time: 48, type: "pace", label: "Pace settled to 139 WPM", tone: "success" },
    { time: 60, type: "repeat", label: "Restart · “I think”", tone: "warning" },
    { time: 77, type: "filler", label: "Filler phrase · “You know”", tone: "warning" },
    { time: 83, type: "visual", label: "Looked away · 1.8 seconds", tone: "neutral" },
    { time: 104, type: "strength", label: "Strong closing invitation", tone: "success" },
  ],
  strengths: [
    "The opening establishes a relatable community problem in one sentence.",
    "Concrete examples make the proposal easy to picture.",
    "The final sentence turns the proposal into a memorable invitation.",
  ],
  recommendations: [
    {
      priority: "Primary",
      title: "Pause instead of restarting",
      why: "The repeated “I think” at 00:59 softens your most practical implementation point.",
      action: "Repeat the same prompt and take one silent breath before each new section. Aim for a clean two-second pause instead of a verbal restart.",
    },
    {
      priority: "Supporting",
      title: "Hold your eye line through transitions",
      why: "Both looking-away events happened as you moved from the proposal into measurement and sponsorship.",
      action: "Place three transition words beside the camera—Problem, Proof, Invitation—and rehearse moving between them without looking down.",
    },
  ],
};
