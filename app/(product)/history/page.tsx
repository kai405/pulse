import type { Metadata } from "next";
import { HistoryList } from "@/components/history-list";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_SESSIONS } from "@/lib/demo-data";
import { getOwnedSessionOverview } from "@/lib/db/session-summaries";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const { sessions } = await getOwnedSessionOverview();
  const showingSamples = sessions.length === 0;
  const visibleSessions = showingSamples ? SAMPLE_SESSIONS : sessions;
  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Practice history</p><h1 className="mt-3 text-4xl font-[760] tracking-[-0.06em] sm:text-5xl">{showingSamples ? "See what progress looks like." : `${sessions.length} practice ${sessions.length === 1 ? "session" : "sessions"}.`}</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Reopen the evidence, not just the score.</p></div>{showingSamples && <Badge tone="accent">All entries below are samples</Badge>}</div><div className="mt-8"><HistoryList sourceSessions={visibleSessions} /></div></div>;
}
