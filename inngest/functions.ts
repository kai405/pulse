import { inngest } from "@/lib/inngest/client";
import { processSession } from "@/lib/processing/process-session";

export const processPracticeSession = inngest.createFunction(
  {
    id: "process-practice-session",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: [{ event: "pulse/session.queued" }],
  },
  async ({ event, step }) => {
    const sessionId = String(event.data.sessionId);
    const userId = String(event.data.userId);
    return step.run("analyze-session", () => processSession(sessionId, userId));
  },
);

export const inngestFunctions = [processPracticeSession];
