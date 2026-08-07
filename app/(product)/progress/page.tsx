import type { Metadata } from "next";
import { ArrowDown, ArrowRight, CalendarDays, Info, Target, Trophy } from "lucide-react";
import { MetricChart } from "@/components/metric-chart";
import { ProgressChart } from "@/components/progress-chart";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PROGRESS_SERIES } from "@/lib/demo-data";
import { getOwnedSessionOverview } from "@/lib/db/session-summaries";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const { sessions, progress } = await getOwnedSessionOverview();
  const showingSamples = sessions.length === 0;
  const series = showingSamples ? PROGRESS_SERIES : progress;
  const first = series[0];
  const latest = series.at(-1);
  const scoreDelta = first && latest ? latest.score - first.score : 0;
  const practiceSeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const baseline = series.length >= 3 ? median(series.slice(0, 3).map((point) => point.score)) : null;
  const supportingSignals = [
    { icon: Target, label: "Pace", value: latest?.pace ? `${Math.round(latest.pace)} WPM` : "—", note: "Target band 126–154" },
    { icon: ArrowDown, label: "Filler rate", value: latest ? `${latest.fillers.toFixed(1)} / min` : "—", note: "Confirmed from timestamps" },
    { icon: CalendarDays, label: "Practice rhythm", value: showingSamples ? "6 sessions" : `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`, note: showingSamples ? "12 minutes represented" : `${Math.round(practiceSeconds / 60)} minutes captured` },
  ];
  return <div>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Progress</p><h1 className="mt-3 text-4xl font-[760] tracking-[-0.06em] sm:text-5xl">{showingSamples ? "See how habits can move." : "Your habits are moving."}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">{showingSamples ? "These six clearly labeled sample sessions demonstrate the progress view." : `${series.length} compatible completed ${series.length === 1 ? "session" : "sessions"} contribute to this view.`} Pulse does not claim statistical significance from a small set.</p></div><div className="flex gap-2"><span className="inline-flex min-h-10 items-center rounded-xl bg-[var(--navy)] px-3 text-xs font-[680] text-white">All compatible sessions</span></div></div>
    <section className="mt-8 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-[var(--navy)] p-6 text-white shadow-[var(--shadow-sm)] sm:p-8">
        <div className="noise-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative">
          <div className="flex items-center justify-between gap-4"><p className="text-xs font-[720] uppercase tracking-[0.12em] text-[var(--accent-on-dark)]">{showingSamples ? "Sample speaking signal" : "Current speaking signal"}</p><Trophy className="size-5 text-[var(--accent-on-dark)]" aria-hidden="true" /></div>
          <div className="mt-6 flex items-end gap-3"><p className="font-mono text-6xl font-[760] leading-none tracking-[-0.08em]">{latest?.score ?? "—"}</p><p className="pb-1 text-sm text-[var(--ink-on-dark-soft)]">/ 100</p></div>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--ink-on-dark-soft)]">{scoreDelta >= 0 ? `Up ${scoreDelta} points from the first compatible session.` : `Down ${Math.abs(scoreDelta)} points from the first compatible session.`} Use the habits beside this score to choose what to practice—not the number alone.</p>
          <div className="mt-7 border-t border-white/15 pt-5">
            <p className="text-xs font-[650] text-[var(--ink-on-dark-soft)]">Evidence rail</p>
            <ol className="mt-3 grid grid-cols-3 text-xs" aria-label="Practice evidence loop">
              {["Practice", "Evidence", "Next action"].map((step, index) => <li key={step} className="relative pr-2"><span className={`relative z-10 block size-2.5 rounded-full ${index === 1 ? "bg-[var(--accent-on-dark)] ring-4 ring-white/10" : "bg-white/35"}`} /><span className="mt-2 block text-[var(--ink-on-dark-soft)]">{step}</span>{index < 2 && <span className="absolute left-2.5 right-0 top-1 h-px bg-white/20" />}</li>)}
            </ol>
          </div>
          <ButtonLink href="/practice" variant="accent" className="mt-7">Practice the next signal <ArrowRight className="size-4" aria-hidden="true" /></ButtonLink>
        </div>
      </div>

      <div className="surface p-5 sm:p-7">
        <div><p className="text-sm font-[700]">Habits behind this signal</p><p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">Comparable measures that explain the change.</p></div>
        <dl className="mt-5 divide-y divide-[var(--line)]">
          {supportingSignals.map((item) => <div key={item.label} className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"><item.icon className="size-4 text-[var(--accent)]" aria-hidden="true" /><div><dt className="text-sm font-[680]">{item.label}</dt><dd className="mt-1 text-xs text-[var(--ink-soft)]">{item.note}</dd></div><dd className="font-mono text-lg font-[720] tracking-[-0.03em]">{item.value}</dd></div>)}
        </dl>
        <div className="mt-6 rounded-xl bg-[var(--surface-muted)] p-4 text-xs leading-5 text-[var(--ink-soft)]"><strong className="text-[var(--ink)]">Why these three:</strong> they are reproducible from stored timing evidence and remain comparable under rubric pulse-1.0.0.</div>
      </div>
    </section>
    <section className="surface mt-5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-[700]">Overall score</p><p className="mt-1 text-xs text-[var(--ink-soft)]">First compatible {first?.score ?? "—"} · current {latest?.score ?? "—"}</p></div><Badge tone="accent">{showingSamples ? "Sample sessions" : `Rubric pulse-1.0.0`}</Badge></div><div className="mt-4"><ProgressChart data={series} isSample={showingSamples} /></div></section>
    <section className="mt-5 grid gap-5 lg:grid-cols-3">
      <div className="surface p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-[700]">Pace</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Target band 126–154</p></div><Badge tone="success">Target-aware</Badge></div><div className="mt-4"><MetricChart data={series} dataKey="pace" label="Words per minute" color="var(--navy)" domain={[100,180]} /></div></div>
      <div className="surface p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-[700]">Filler rate</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Confirmed fillers/minute</p></div><Badge tone="success">Deterministic</Badge></div><div className="mt-4"><MetricChart data={series} dataKey="fillers" label="Fillers per minute" color="var(--accent)" domain={[0,7]} /></div></div>
      <div className="surface p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-[700]">Camera engagement</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Head-orientation proxy</p></div><Badge tone="warning">Medium confidence</Badge></div><div className="mt-4"><MetricChart data={series} dataKey="engagement" label="Camera engagement percent" color="var(--success)" domain={[40,100]} /></div></div>
    </section>
    <section className="surface mt-5 grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><Info className="size-4 text-[var(--navy)]" /><p className="text-sm font-[700]">What Pulse can responsibly say</p></div><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{series.length >= 3 ? "The compatible results show a directional pattern. Recommendations prioritize the weakest recurring behavior rather than chasing the overall number." : "Complete three compatible sessions before Pulse describes a personal trend. Individual results remain useful practice evidence."}</p></div><div className="rounded-xl bg-[var(--surface-muted)] px-5 py-4 text-center"><p className="text-xs text-[var(--ink-soft)]">Baseline</p><p className="mt-1 font-mono text-2xl font-[730]">{baseline ?? "—"}</p><p className="text-[0.68rem] text-[var(--ink-soft)]">first 3 median</p></div></section>
  </div>;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}
