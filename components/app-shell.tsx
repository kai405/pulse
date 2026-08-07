"use client";

import { BarChart3, Clock3, Home, Menu, Mic2, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Application" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-[650] transition-colors",
              active ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
            )}
          >
            <item.icon className="size-4.5" strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, weeklyCount, weeklyGoal, workspace }: { children: React.ReactNode; weeklyCount: number; weeklyGoal: number; workspace: "demo" | "guest" | "account" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[var(--line)] bg-[var(--surface-warm)] p-4 lg:flex">
        <div className="px-2 py-2"><Logo href="/dashboard" /></div>
        <div className="mt-8 flex-1"><NavLinks /></div>
        <div className="rounded-2xl bg-[var(--navy)] p-4 text-white">
          <p className="text-xs font-[650] text-[var(--ink-on-dark-soft)]">Weekly rhythm</p>
          <div className="mt-3 flex items-end justify-between"><span className="text-2xl font-[740] tracking-[-0.04em]">{weeklyCount} / {weeklyGoal}</span><span className="text-xs text-[var(--ink-on-dark-soft)]">sessions</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--accent-on-dark)]" style={{ width: `${Math.min(100, (weeklyCount / weeklyGoal) * 100)}%` }} /></div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-[760] text-[var(--accent-dark)]">{workspace === "account" ? "S" : workspace === "guest" ? "G" : "D"}</span>
          <div className="min-w-0"><p className="truncate text-sm font-[680]">{workspace === "account" ? "Saved workspace" : workspace === "guest" ? "Guest practice" : "Demo workspace"}</p><p className="truncate text-xs text-[var(--ink-soft)]">{workspace === "account" ? "Synced to your account" : workspace === "guest" ? "Expires in 7 days" : "Sample data only"}</p></div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--canvas)]/90 px-4 backdrop-blur-lg lg:hidden">
        <Logo href="/dashboard" />
        <button onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Open navigation"><Menu className="size-5" /></button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm lg:hidden" role="presentation" onClick={() => setMenuOpen(false)}>
          <aside className="ml-auto flex h-full w-[min(86vw,320px)] flex-col bg-[var(--surface)] p-4 shadow-2xl" role="dialog" aria-modal="true" aria-label="Navigation" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-2 py-2"><Logo href="/dashboard" /><button onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-xl hover:bg-[var(--surface-muted)]" aria-label="Close navigation"><X className="size-5" /></button></div>
            <div className="mt-7 flex-1"><NavLinks onNavigate={() => setMenuOpen(false)} /></div>
            <ButtonLink href="/practice" variant="accent" className="w-full" onClick={() => setMenuOpen(false)}><Mic2 className="size-4" /> Start a practice</ButtonLink>
          </aside>
        </div>
      )}

      <main className="min-w-0 lg:col-start-2">
        <div className="mx-auto w-full max-w-[1260px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
