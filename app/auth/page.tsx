import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Start practicing" };

export default function AuthPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-8"><Logo /><div className="flex flex-1 items-center justify-center py-12"><AuthCard /></div></section>
      <aside className="relative hidden overflow-hidden bg-[var(--navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="noise-grid absolute inset-0 opacity-20" />
        <div className="relative"><p className="text-sm font-[650] text-[var(--ink-on-dark-subtle)]">Evidence over impression</p><p className="mt-5 max-w-xl text-4xl font-[710] leading-[1.15] tracking-[-0.055em]">“I stopped trying to sound polished and started practicing the exact moments where I lost the room.”</p></div>
        <div className="relative grid grid-cols-3 gap-3">{[["142", "WPM"], ["2.1", "fillers/min"], ["84%", "engagement"]].map(([value,label]) => <div key={label} className="rounded-2xl border border-white/15 bg-white/5 p-4"><p className="font-mono text-2xl font-[700]">{value}</p><p className="mt-1 text-xs text-[var(--ink-on-dark-subtle)]">{label}</p></div>)}</div>
      </aside>
    </main>
  );
}
