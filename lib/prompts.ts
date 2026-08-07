import type { Difficulty, PracticeMode } from "@/lib/product";

export type PracticePrompt = {
  id: string;
  mode: PracticeMode;
  category: "Work and Leadership" | "Personal Stories" | "Ideas and Opinions" | "Everyday Life" | "Creative and Playful";
  difficulty: Difficulty;
  text: string;
  guidance: string;
};

export const PRACTICE_PROMPTS: PracticePrompt[] = [
  { id: "imp-work-b", mode: "impromptu", category: "Work and Leadership", difficulty: "beginner", text: "What makes someone a reliable teammate?", guidance: "Name one quality and support it with an example." },
  { id: "imp-work-i", mode: "impromptu", category: "Work and Leadership", difficulty: "intermediate", text: "Should leaders make important decisions quickly or wait for broad agreement?", guidance: "Take a position and acknowledge the tradeoff." },
  { id: "imp-work-a", mode: "impromptu", category: "Work and Leadership", difficulty: "advanced", text: "When does a team’s pursuit of alignment become avoidance of accountability?", guidance: "Define the boundary and propose a practical test." },
  { id: "imp-story-b", mode: "impromptu", category: "Personal Stories", difficulty: "beginner", text: "Describe a small moment that made your week better.", guidance: "Set the scene, describe the moment, and say why it mattered." },
  { id: "imp-story-i", mode: "impromptu", category: "Personal Stories", difficulty: "intermediate", text: "Tell the story of a time you changed your mind about something important.", guidance: "Show what you believed before, what changed, and what followed." },
  { id: "imp-story-a", mode: "impromptu", category: "Personal Stories", difficulty: "advanced", text: "Describe a failure whose value only became clear much later.", guidance: "Connect the original event to a later decision or strength." },
  { id: "imp-ideas-b", mode: "impromptu", category: "Ideas and Opinions", difficulty: "beginner", text: "Is it better to be early or exactly on time?", guidance: "Give a clear opinion and one reason." },
  { id: "imp-ideas-i", mode: "impromptu", category: "Ideas and Opinions", difficulty: "intermediate", text: "What everyday skill should every school teach?", guidance: "Explain the gap and the practical benefit." },
  { id: "imp-ideas-a", mode: "impromptu", category: "Ideas and Opinions", difficulty: "advanced", text: "Does convenience make us more capable or more dependent?", guidance: "Build a nuanced argument with a concrete example." },
  { id: "imp-life-b", mode: "impromptu", category: "Everyday Life", difficulty: "beginner", text: "What is the best way to spend an unexpected free hour?", guidance: "Choose one answer and make it vivid." },
  { id: "imp-life-i", mode: "impromptu", category: "Everyday Life", difficulty: "intermediate", text: "Describe one change that would improve your community and persuade others to support it.", guidance: "Frame the problem, proposal, and first practical step." },
  { id: "imp-life-a", mode: "impromptu", category: "Everyday Life", difficulty: "advanced", text: "How should a city balance public gathering spaces with competing commercial needs?", guidance: "Identify stakeholders and propose a fair principle." },
  { id: "imp-play-b", mode: "impromptu", category: "Creative and Playful", difficulty: "beginner", text: "Invent a holiday for something people overlook.", guidance: "Name it and describe one tradition." },
  { id: "imp-play-i", mode: "impromptu", category: "Creative and Playful", difficulty: "intermediate", text: "Convince a skeptical audience that naps should be treated as a serious skill.", guidance: "Use a surprising premise and a practical benefit." },
  { id: "imp-play-a", mode: "impromptu", category: "Creative and Playful", difficulty: "advanced", text: "Defend the idea that boredom is an essential public resource.", guidance: "Turn an unusual claim into a coherent argument." },

  { id: "int-work-b", mode: "interview", category: "Work and Leadership", difficulty: "beginner", text: "Tell me about a project you are proud of.", guidance: "Explain the goal, your contribution, and the result." },
  { id: "int-work-i", mode: "interview", category: "Work and Leadership", difficulty: "intermediate", text: "Tell me about a time you helped a team move through uncertainty.", guidance: "Use situation, action, and result; be specific about your role." },
  { id: "int-work-a", mode: "interview", category: "Work and Leadership", difficulty: "advanced", text: "Describe a decision you made with incomplete information and how you evaluated it afterward.", guidance: "Show judgment, tradeoffs, and learning without hindsight bias." },
  { id: "int-story-b", mode: "interview", category: "Personal Stories", difficulty: "beginner", text: "What experience first shaped your current goals?", guidance: "Choose one experience and connect it directly to today." },
  { id: "int-story-i", mode: "interview", category: "Personal Stories", difficulty: "intermediate", text: "Tell me about feedback that was difficult to hear but useful.", guidance: "Explain your response and the behavior that changed." },
  { id: "int-story-a", mode: "interview", category: "Personal Stories", difficulty: "advanced", text: "Which personal assumption has most limited your work, and how are you testing it?", guidance: "Be candid while demonstrating an active learning process." },
  { id: "int-ideas-b", mode: "interview", category: "Ideas and Opinions", difficulty: "beginner", text: "What does doing excellent work mean to you?", guidance: "Define excellence in observable terms." },
  { id: "int-ideas-i", mode: "interview", category: "Ideas and Opinions", difficulty: "intermediate", text: "What commonly accepted workplace practice would you redesign?", guidance: "Diagnose the problem and offer a credible alternative." },
  { id: "int-ideas-a", mode: "interview", category: "Ideas and Opinions", difficulty: "advanced", text: "How should an organization decide when efficiency is no longer the right objective?", guidance: "Use principles, competing values, and an example." },
  { id: "int-life-b", mode: "interview", category: "Everyday Life", difficulty: "beginner", text: "How do you organize a busy week?", guidance: "Describe a repeatable system rather than a list of tools." },
  { id: "int-life-i", mode: "interview", category: "Everyday Life", difficulty: "intermediate", text: "Tell me about a commitment you had to renegotiate.", guidance: "Show clear communication, ownership, and the outcome." },
  { id: "int-life-a", mode: "interview", category: "Everyday Life", difficulty: "advanced", text: "Describe a boundary you established that improved both your work and a relationship.", guidance: "Explain the tension, conversation, and lasting effect." },
  { id: "int-play-b", mode: "interview", category: "Creative and Playful", difficulty: "beginner", text: "If you could master one harmlessly impractical skill, what would it be?", guidance: "Let your answer reveal how you think and what you enjoy." },
  { id: "int-play-i", mode: "interview", category: "Creative and Playful", difficulty: "intermediate", text: "Explain your working style using a place rather than an adjective.", guidance: "Make the analogy specific and useful." },
  { id: "int-play-a", mode: "interview", category: "Creative and Playful", difficulty: "advanced", text: "Teach me something important using only a metaphor from cooking.", guidance: "Keep the metaphor coherent and land a practical insight." },

  { id: "pre-work-b", mode: "presentation", category: "Work and Leadership", difficulty: "beginner", text: "Present one simple change that would make team meetings more useful.", guidance: "State the problem, change, and expected result." },
  { id: "pre-work-i", mode: "presentation", category: "Work and Leadership", difficulty: "intermediate", text: "Present a proposal for improving communication on a remote team.", guidance: "Use a clear recommendation, operating details, and success measure." },
  { id: "pre-work-a", mode: "presentation", category: "Work and Leadership", difficulty: "advanced", text: "Recommend how a growing organization should preserve speed without losing accountability.", guidance: "Organize around principles, mechanisms, and risks." },
  { id: "pre-story-b", mode: "presentation", category: "Personal Stories", difficulty: "beginner", text: "Share a lesson from the first time you took responsibility for a group outcome.", guidance: "Use one scene and one lesson." },
  { id: "pre-story-i", mode: "presentation", category: "Personal Stories", difficulty: "intermediate", text: "Use a personal story to explain why preparation changes confidence.", guidance: "Connect the story to a broader takeaway." },
  { id: "pre-story-a", mode: "presentation", category: "Personal Stories", difficulty: "advanced", text: "Build a short talk around a contradiction that shaped your approach to leadership.", guidance: "Let the contradiction drive the structure." },
  { id: "pre-ideas-b", mode: "presentation", category: "Ideas and Opinions", difficulty: "beginner", text: "Explain why one ordinary habit deserves more attention.", guidance: "Use a simple claim, example, and close." },
  { id: "pre-ideas-i", mode: "presentation", category: "Ideas and Opinions", difficulty: "intermediate", text: "Make the case that better questions matter more than faster answers.", guidance: "Define better questions and show a practical consequence." },
  { id: "pre-ideas-a", mode: "presentation", category: "Ideas and Opinions", difficulty: "advanced", text: "Present a framework for deciding which technology should remain deliberately inconvenient.", guidance: "Offer criteria, counterargument, and application." },
  { id: "pre-life-b", mode: "presentation", category: "Everyday Life", difficulty: "beginner", text: "Teach an audience a three-step routine that makes mornings easier.", guidance: "Make each step concrete and memorable." },
  { id: "pre-life-i", mode: "presentation", category: "Everyday Life", difficulty: "intermediate", text: "Propose a neighborhood program that helps people share useful skills.", guidance: "Explain participation, logistics, and the first measure of success." },
  { id: "pre-life-a", mode: "presentation", category: "Everyday Life", difficulty: "advanced", text: "Present a policy for making public spaces feel safer without making them feel controlled.", guidance: "Address competing needs and unintended effects." },
  { id: "pre-play-b", mode: "presentation", category: "Creative and Playful", difficulty: "beginner", text: "Teach the audience how to host the perfect five-minute celebration.", guidance: "Give it a beginning, ritual, and ending." },
  { id: "pre-play-i", mode: "presentation", category: "Creative and Playful", difficulty: "intermediate", text: "Present an awards ceremony for three underrated everyday objects.", guidance: "Use a repeated structure and a strong final winner." },
  { id: "pre-play-a", mode: "presentation", category: "Creative and Playful", difficulty: "advanced", text: "Deliver a serious keynote from the perspective of a public bench.", guidance: "Sustain the perspective while landing a human insight." },

  { id: "pit-work-b", mode: "elevator-pitch", category: "Work and Leadership", difficulty: "beginner", text: "Pitch a tool that makes team handoffs clearer.", guidance: "Name the user, problem, solution, and benefit." },
  { id: "pit-work-i", mode: "elevator-pitch", category: "Work and Leadership", difficulty: "intermediate", text: "Pitch a service that helps first-time managers practice difficult conversations.", guidance: "Include a specific user moment and differentiator." },
  { id: "pit-work-a", mode: "elevator-pitch", category: "Work and Leadership", difficulty: "advanced", text: "Pitch a product that reduces organizational drag without adding another dashboard.", guidance: "Make the mechanism and wedge credible." },
  { id: "pit-story-b", mode: "elevator-pitch", category: "Personal Stories", difficulty: "beginner", text: "Pitch a service inspired by a problem you have experienced personally.", guidance: "Use the story briefly, then move to the value." },
  { id: "pit-story-i", mode: "elevator-pitch", category: "Personal Stories", difficulty: "intermediate", text: "Turn a frustrating personal experience into a compelling product pitch.", guidance: "Separate the emotional hook from the market claim." },
  { id: "pit-story-a", mode: "elevator-pitch", category: "Personal Stories", difficulty: "advanced", text: "Pitch a company whose origin story creates a defensible advantage.", guidance: "Show why the story matters to execution, not just branding." },
  { id: "pit-ideas-b", mode: "elevator-pitch", category: "Ideas and Opinions", difficulty: "beginner", text: "Pitch a newsletter that helps people understand one complex topic.", guidance: "Define the audience and distinct promise." },
  { id: "pit-ideas-i", mode: "elevator-pitch", category: "Ideas and Opinions", difficulty: "intermediate", text: "Pitch a platform that rewards thoughtful disagreement.", guidance: "Explain the behavior, incentive, and user value." },
  { id: "pit-ideas-a", mode: "elevator-pitch", category: "Ideas and Opinions", difficulty: "advanced", text: "Pitch a business built around giving people less information, not more.", guidance: "Make the counterintuitive value proposition concrete." },
  { id: "pit-life-b", mode: "elevator-pitch", category: "Everyday Life", difficulty: "beginner", text: "Pitch an app that makes grocery planning easier.", guidance: "Focus on one recurring pain point and outcome." },
  { id: "pit-life-i", mode: "elevator-pitch", category: "Everyday Life", difficulty: "intermediate", text: "Pitch a product that helps neighbors share useful skills.", guidance: "Explain trust, exchange, and the first user group." },
  { id: "pit-life-a", mode: "elevator-pitch", category: "Everyday Life", difficulty: "advanced", text: "Pitch a service that turns underused urban space into a shared community asset.", guidance: "Address supply, demand, trust, and a narrow starting market." },
  { id: "pit-play-b", mode: "elevator-pitch", category: "Creative and Playful", difficulty: "beginner", text: "Pitch a subscription box for people who dislike subscription boxes.", guidance: "Use the contradiction to create a clear promise." },
  { id: "pit-play-i", mode: "elevator-pitch", category: "Creative and Playful", difficulty: "intermediate", text: "Pitch a museum whose exhibits disappear every night.", guidance: "Explain why impermanence creates value." },
  { id: "pit-play-a", mode: "elevator-pitch", category: "Creative and Playful", difficulty: "advanced", text: "Pitch a premium service whose main feature is that customers rarely use it.", guidance: "Make the economics and trust proposition believable." },
];

export function getFilteredPrompts(mode: PracticeMode, category: string, difficulty: Difficulty) {
  return PRACTICE_PROMPTS.filter(
    (prompt) => prompt.mode === mode && prompt.category === category && prompt.difficulty === difficulty,
  );
}
