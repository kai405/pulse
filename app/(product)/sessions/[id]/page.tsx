import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionResults } from "@/components/session-results";
import { SAMPLE_SESSIONS } from "@/lib/demo-data";
import { getOwnedSessionResult } from "@/lib/db/session-results";

export const metadata: Metadata = { title: "Session results" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (SAMPLE_SESSIONS.some((session) => session.id === id)) return <SessionResults />;
  const result = await getOwnedSessionResult(id);
  if (!result) notFound();
  return <SessionResults result={result} />;
}
