"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { SessionRow } from "@/components/session-row";
import { ButtonLink } from "@/components/ui/button";
import { MODE_LABELS, PRACTICE_MODES, type PracticeMode } from "@/lib/product";
import type { SessionSummary } from "@/lib/demo-data";

export function HistoryList({ sourceSessions }: { sourceSessions: SessionSummary[] }) {
  const [mode, setMode] = useState<PracticeMode | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "score">("newest");
  const sessions = useMemo(
    () =>
      sourceSessions
        .filter((session) => (mode === "all" || session.mode === mode) && session.prompt.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
        .slice()
        .sort((a, b) => sort === "score" ? (b.score ?? 0) - (a.score ?? 0) : sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)),
    [mode, query, sort, sourceSessions],
  );
  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative"><span className="sr-only">Search session prompts</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts" className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-warm)] pl-10 pr-3 text-sm" /></label>
        <label className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-[var(--ink-soft)]" /><span className="sr-only">Filter by preset</span><select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode | "all")} className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="all">All presets</option>{PRACTICE_MODES.map((item) => <option key={item} value={item}>{MODE_LABELS[item]}</option>)}</select></label>
        <label><span className="sr-only">Sort sessions</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="score">Highest score</option></select></label>
      </div>
      <div className="surface mt-4 px-5 sm:px-7">{sessions.length ? sessions.map((session) => <SessionRow key={session.id} session={session} />) : <div className="py-16 text-center"><p className="text-lg font-[720]">No sessions match those filters.</p><p className="mt-2 text-sm text-[var(--ink-soft)]">Reset the search or start a new practice.</p><div className="mt-5 flex justify-center gap-2"><button className="text-sm font-[680] text-[var(--accent-dark)]" onClick={() => { setMode("all"); setQuery(""); }}>Reset filters</button><ButtonLink href="/practice" variant="accent" size="sm">Start practice</ButtonLink></div></div>}</div>
    </div>
  );
}
