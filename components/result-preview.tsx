import { ArrowUpRight, Check, Clock3, MessageCircleMore } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";

export function ResultPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-label="Example Pulse analysis">
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-[var(--navy-soft)]/65 blur-2xl" />
      <div className="surface overflow-hidden rounded-[1.6rem] border-white/80 shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-[680] text-[var(--ink-soft)]">Impromptu · 1:54</p>
            <p className="mt-1 text-sm font-[700]">Community skill-share proposal</p>
          </div>
          <Badge tone="success">Analysis ready</Badge>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          <div className="flex justify-center"><ScoreRing score={82} /></div>
          <div className="flex flex-col justify-center">
            <Badge tone="accent" className="w-fit">+6 from last session</Badge>
            <h2 className="mt-3 text-xl font-[740] tracking-[-0.04em]">A clear idea, convincingly closed.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Your structure improved. The next gain is replacing restart phrases with deliberate pauses.</p>
          </div>
        </div>
        <div className="grid gap-3 border-y border-[var(--line)] bg-[var(--surface-warm)] p-4 sm:grid-cols-3 sm:px-6">
          {[
            { icon: Clock3, label: "Pace", value: "142 WPM", note: "On target" },
            { icon: MessageCircleMore, label: "Fillers", value: "2.1/min", note: "Down 18%" },
            { icon: Check, label: "Engagement", value: "84%", note: "Reliable" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="flex items-center gap-2 text-xs font-[650] text-[var(--ink-soft)]">
                <item.icon className="size-3.5" aria-hidden="true" /> {item.label}
              </div>
              <p className="mt-2 font-mono text-lg font-[700] tracking-[-0.04em]">{item.value}</p>
              <p className="mt-0.5 text-xs text-[var(--success)]">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="p-5 sm:p-6">
          <p className="eyebrow">Highest-priority action</p>
          <div className="mt-3 flex items-start justify-between gap-4 rounded-xl bg-[var(--accent-soft)] p-4">
            <div>
              <p className="text-sm font-[730]">Pause instead of restarting</p>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">Rehearse the same prompt, taking one silent breath before every new section.</p>
            </div>
            <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-[var(--accent-dark)]" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
