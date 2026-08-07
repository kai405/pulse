import { after } from "next/server";
import { getServerEnv } from "@/lib/env";
import { inngest } from "@/lib/inngest/client";
import { processSession } from "@/lib/processing/process-session";

export async function queueSession(sessionId: string, userId: string) {
  const env = getServerEnv();
  if (env.INNGEST_EVENT_KEY) {
    await inngest.send({ name: "pulse/session.queued", data: { sessionId, userId } });
    return "inngest" as const;
  }
  after(() => processSession(sessionId, userId));
  return "next-after" as const;
}
