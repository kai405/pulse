import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, Flame, Mic2, Target } from "lucide-react";
import { ProgressChart } from "@/components/progress-chart";
import { SessionRow } from "@/components/session-row";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PROGRESS_SERIES, SAMPLE_RESULT, SAMPLE_SESSIONS } from "@/lib/demo-data";
import { getOwnedSessionResult } from "@/lib/db/session-results";
import { getOwnedSessionOverview } from "@/lib/db/session-summaries";

export const metadata: Metadata = { title: "Today" };
const PAGE_DATE = new Date();

export default async function DashboardPage() {
  const { sessions, progress, weeklyCount, weeklyGoal } = await getOwnedSessionOverview();
  const showingSamples = sessions.length === 0;
  const visibleSessions = showingSamples ? SAMPLE_SESSIONS : sessions;
  const visibleProgress = showingSamples ? PROGRESS_SERIES : progress;
  const scoreDelta = visibleProgress.length > 1 ? visibleProgress.at(-1)!.score - visibleProgress[0]!.score : 0;
  const latestCompleted = sessions.find((session) => session.score !== null && ["completed", "partial"].includes(session.status));
  const latestResult = latestCompleted ? await getOwnedSessionResult(latestCompleted.id) : null;
  const insight = showingSamples ? SAMPLE_RESULT : latestResult;
  const weakest = insight?.categories.filter((category) => category.confidence !== "Low" && category.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  const recommendation = insight?.recommendations[0];
  const habitMetrics = insight
    ? [...insight.categories].filter((category) => category.confidence !== "Low" && category.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3)
    : [];
  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(PAGE_DATE)}</p><h1 className="mt-3 text-4xl font-[760] tracking-[-0.06em] sm:text-5xl">{showingSamples ? "Build your first speaking signal." : weakest ? `${weakest.label} is your next edge.` : "Your latest speaking signal is ready."}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">{showingSamples ? "Complete one practice to replace the clearly labeled example below with your own evidence." : recommendation?.why ?? insight?.summary ?? "Open your latest session to turn the evidence into one focused next practice."}</p></div>
        <ButtonLink href="/practice" variant="accent" size="lg"><Mic2 className="size-4" aria-hidden="true" /> Start a practice</ButtonLink>
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="surface overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div><Badge tone="accent">{showingSamples ? "Example recommendation" : "Recommended next"}</Badge><h2 className="mt-3 text-2xl font-[730] tracking-[-0.045em]">{recommendation?.title ?? "Repeat with one clear focus"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">{recommendation?.action ?? "Repeat your latest prompt and improve one observable behavior instead of chasing every score."}</p></div>
            <ButtonLink href={`/practice${weakest ? `?focus=${weakest.key}` : ""}`} variant="primary" className="shrink-0">Practice this <ArrowRight className="size-4" /></ButtonLink>
          </div>
          <div className="grid gap-4 bg-[var(--surface-warm)] p-5 sm:grid-cols-3 sm:p-7">
            {[
              { icon: Target, label: "Why this", value: insight?.priority ?? "Build a baseline", note: showingSamples ? "sample evidence" : "latest session evidence" },
              { icon: CalendarDays, label: "Time needed", value: "4 minutes", note: "setup + practice" },
              { icon: CheckCircle2, label: "Success marker", value: "One observable change", note: "compare the evidence" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--line)] bg-white p-4"><item.icon className="size-4 text-[var(--accent)]" aria-hidden="true" /><p className="mt-3 text-xs font-[650] text-[var(--ink-soft)]">{item.label}</p><p className="mt-1 text-lg font-[720] tracking-[-0.035em]">{item.value}</p><p className="mt-0.5 text-xs text-[var(--ink-soft)]">{item.note}</p></div>
            ))}
          </div>
        </div>
        <div className="surface flex flex-col justify-between p-6">
          <div><div className="flex items-center justify-between"><p className="text-sm font-[700]">Weekly rhythm</p><Flame className="size-5 text-[var(--accent)]" aria-hidden="true" /></div><p className="mt-6 text-5xl font-[760] tracking-[-0.07em]">{weeklyCount}<span className="text-2xl text-[var(--ink-soft)]"> / {weeklyGoal}</span></p><p className="mt-2 text-sm text-[var(--ink-soft)]">{weeklyCount >= weeklyGoal ? "Weekly goal complete." : `${weeklyGoal-weeklyCount} ${weeklyGoal-weeklyCount === 1 ? "practice" : "practices"} to complete your goal.`}</p></div>
          <div className="mt-8"><div className="flex gap-2" aria-label={`${Math.min(weeklyCount, weeklyGoal)} of ${weeklyGoal} weekly sessions complete`}>{Array.from({ length: weeklyGoal }, (_, index) => <span key={index} className={`h-2 flex-1 rounded-full ${index < weeklyCount ? "bg-[var(--accent)]" : "bg-[var(--surface-muted)]"}`} />)}</div><p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">Consistency matters more than a daily streak. Your week resets Monday.</p></div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface p-5 sm:p-7">
          <div className="flex items-start justify-between"><div><p className="text-sm font-[700]">Overall progress</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{showingSamples ? "Six compatible sample sessions" : `${visibleProgress.length} compatible completed sessions`} · rubric pulse-1.0.0</p></div><Badge tone={scoreDelta >= 0 ? "success" : "warning"}>{scoreDelta >= 0 ? "+" : ""}{scoreDelta} points</Badge></div>
          <div className="mt-4"><ProgressChart data={visibleProgress} isSample={showingSamples} /></div>
          <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">Directional pattern only. Pulse waits for three compatible sessions before describing a trend.</p>
        </div>
        <div className="surface p-5 sm:p-7">
          <p className="text-sm font-[700]">Habits at a glance</p>
          <div className="mt-5 space-y-5">
            {habitMetrics.map((metric, index) => (
              <div key={metric.label}><div className="flex items-center justify-between text-xs"><span className="font-[650]">{metric.label}</span><span><strong>{metric.score}</strong> {metric.delta !== null && <span className={metric.delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>{metric.delta >= 0 ? "+" : ""}{metric.delta}</span>}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className={`h-full rounded-full ${index === 0 ? "bg-[var(--success)]" : index === 1 ? "bg-[var(--navy)]" : "bg-[var(--accent)]"}`} style={{ width: `${metric.score ?? 0}%` }} /></div></div>
            ))}
            {!habitMetrics.length && <p className="text-sm leading-6 text-[var(--ink-soft)]">Complete analysis to populate comparable category evidence.</p>}
          </div>
          <ButtonLink href="/progress" variant="ghost" className="mt-6 w-full justify-between px-0">See all progress <ArrowRight className="size-4" /></ButtonLink>
        </div>
      </section>

      <section className="surface mt-5 p-5 sm:p-7">
        <div className="flex items-end justify-between"><div><p className="text-sm font-[700]">Recent sessions</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{showingSamples ? "Sample data is labeled and never mixed with your own." : "Your latest saved practice sessions."}</p></div><ButtonLink href="/history" variant="ghost" size="sm">View history <ArrowRight className="size-4" /></ButtonLink></div>
        <div className="mt-4">{visibleSessions.slice(0, 3).map((session) => <SessionRow key={session.id} session={session} />)}</div>
      </section>
    </div>
  );
}
