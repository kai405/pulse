import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "How scoring works" };

const CATEGORIES = [
  ["Delivery mechanics", "25%", "Pace, consistency, pause rhythm, vocal variation, and target duration."],
  ["Fluency", "20%", "Filler rate, repetition, verbal clarity, and sentence flow."],
  ["Structure & content", "30%", "Organization, clarity, conciseness, relevance, opening, and conclusion."],
  ["Visual presence", "15%", "Camera engagement, framing, facial activity, and purposeful movement."],
  ["Confident delivery", "10%", "Observable conviction, composure, audibility, and completion of thoughts."],
];

export default function ScoringPage() {
  return (
    <main>
      <MarketingNav />
      <article className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-24">
        <Badge tone="accent">Rubric pulse-1.0.0</Badge>
        <h1 className="mt-6 text-balance text-5xl font-[760] tracking-[-0.065em]">A score should never feel like a guess.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">Pulse calculates observable facts directly, uses a documented AI rubric only for interpretation, and shows the evidence and confidence behind both.</p>
        <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {CATEGORIES.map(([title, weight, copy]) => (
            <div key={title} className="grid gap-2 border-b border-[var(--line)] p-5 last:border-0 sm:grid-cols-[1fr_auto] sm:p-6">
              <div><h2 className="font-[720]">{title}</h2><p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{copy}</p></div>
              <span className="font-mono text-lg font-[700]">{weight}</span>
            </div>
          ))}
        </div>
        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="surface p-6"><h2 className="font-[720]">When data is unreliable</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Pulse shows the limitation, removes the metric from aggregation, and reweights what remains. Poor lighting is not poor performance.</p></div>
          <div className="surface p-6"><h2 className="font-[720]">When rubrics change</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Every session stores its rubric version. Incompatible versions are never silently combined in trends.</p></div>
        </section>
      </article>
    </main>
  );
}
