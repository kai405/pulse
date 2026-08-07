import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MODE_LABELS } from "@/lib/product";
import type { SessionSummary } from "@/lib/demo-data";
import { formatDate, formatDuration } from "@/lib/utils";

export function SessionRow({ session }: { session: SessionSummary }) {
  const href = ["processing", "failed", "incomplete"].includes(session.status)
    ? `/sessions/${session.id}/processing`
    : `/sessions/${session.id}`;
  return (
    <Link href={href} className="group grid min-h-20 items-center gap-3 border-b border-[var(--line)] px-1 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{MODE_LABELS[session.mode]}</Badge>
          {session.isSample && <Badge tone="accent">Sample</Badge>}
          {!session.isSample && session.status !== "completed" && session.status !== "partial" && <Badge tone={session.status === "failed" ? "warning" : "neutral"}>{session.status === "failed" ? "Analysis stopped" : session.status === "incomplete" ? "Too short to score" : "Processing"}</Badge>}
          <span className="text-xs text-[var(--ink-soft)]">{formatDate(session.createdAt)}</span>
        </div>
        <p className="mt-2 truncate text-sm font-[680] tracking-[-0.015em] group-hover:text-[var(--accent-dark)]">{session.prompt}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)]"><Clock3 className="size-3.5" aria-hidden="true" />{formatDuration(session.durationSeconds)}</span>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="font-mono text-lg font-[720]">{session.score ?? "—"}</span>
        <ArrowUpRight className="size-4 text-[var(--ink-soft)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}
