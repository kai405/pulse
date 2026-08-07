"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Check, Database, KeyRound, LoaderCircle, Mic2, Shield, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { MODE_LABELS, PRACTICE_MODES, type PracticeMode } from "@/lib/product";
import type { SettingsProfile } from "@/lib/db/profile";

export function SettingsForm({ initialProfile, workspace }: { initialProfile: SettingsProfile | null; workspace: "demo" | "guest" | "account" }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(initialProfile?.displayName ?? "");
  const [targetWpm, setTargetWpm] = useState(initialProfile?.targetWpm ?? 140);
  const [weeklyGoal, setWeeklyGoal] = useState(initialProfile?.weeklyGoal ?? 3);
  const [mode, setMode] = useState<PracticeMode>(initialProfile?.preferredMode ?? "impromptu");
  const [triggers, setTriggers] = useState(initialProfile?.triggerWords.join(", ") ?? "basically, you know");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const animation = requestAnimationFrame(() => {
      if (initialProfile) return;
      const raw = localStorage.getItem("pulse-profile");
      if (!raw) return;
      try { const profile = JSON.parse(raw) as { displayName?: string; targetWpm?: number; preferredMode?: PracticeMode; triggerWords?: string[] }; setName(profile.displayName ?? ""); setTargetWpm(profile.targetWpm ?? 140); setMode(profile.preferredMode ?? "impromptu"); setTriggers(profile.triggerWords?.join(", ") ?? ""); } catch { /* ignore malformed local demo state */ }
    });
    return () => cancelAnimationFrame(animation);
  }, [initialProfile]);

  async function save() {
    const current = JSON.parse(localStorage.getItem("pulse-profile") ?? "{}") as Record<string, unknown>;
    const profile = { ...current, displayName: name, targetWpm, preferredMode: mode, triggerWords: triggers.split(",").map((item) => item.trim()).filter(Boolean), weeklyGoal, goal: current.goal ?? "clarity", experience: current.experience ?? "beginner", onboardingCompleted: true };
    localStorage.setItem("pulse-profile", JSON.stringify(profile));
    await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(profile) }).catch(() => undefined);
    setSaved(true); window.setTimeout(() => setSaved(false), 2500);
  }

  async function deleteAccount() {
    setDeleting(true); setDeleteError("");
    const response = await fetch("/api/account", { method: "DELETE" });
    if (response.ok) { localStorage.removeItem("pulse-profile"); router.push("/"); router.refresh(); } else { setDeleteError("Pulse could not delete the workspace. Try again."); setDeleting(false); }
  }

  function resetDemo() { localStorage.removeItem("pulse-profile"); router.push("/"); router.refresh(); }

  return <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
    <div className="space-y-5">
      <section className="surface p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--navy-soft)]"><UserRound className="size-4" /></span><div><h2 className="font-[720]">Practice profile</h2><p className="text-xs text-[var(--ink-soft)]">Used for defaults and recommendations.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-[680]">Display name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 font-normal" placeholder="Guest" /></label><label className="text-sm font-[680]">Preferred preset<select value={mode} onChange={(event) => setMode(event.target.value as PracticeMode)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 font-normal">{PRACTICE_MODES.map((item) => <option key={item} value={item}>{MODE_LABELS[item]}</option>)}</select></label><label className="text-sm font-[680]">Target pace <span className="font-normal text-[var(--ink-soft)]">{targetWpm} WPM</span><input type="range" min="100" max="180" step="5" value={targetWpm} onChange={(event) => setTargetWpm(Number(event.target.value))} className="mt-4 w-full accent-[var(--accent)]" /></label><label className="text-sm font-[680]">Weekly session goal<select value={weeklyGoal} onChange={(event) => setWeeklyGoal(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 font-normal">{[1,2,3,4,5,6,7].map((value) => <option key={value} value={value}>{value} {value === 1 ? "session" : "sessions"}</option>)}</select></label><label className="text-sm font-[680] sm:col-span-2">Trigger words<textarea value={triggers} onChange={(event) => setTriggers(event.target.value)} className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[var(--line-strong)] bg-white p-3 font-normal" /><span className="mt-1 block text-xs font-normal text-[var(--ink-soft)]">Counted as evidence; never automatically penalized.</span></label></div><div className="mt-6 flex items-center justify-end gap-3">{saved && <span role="status" className="inline-flex items-center gap-1.5 text-xs font-[650] text-[var(--success)]"><Check className="size-3.5" /> Saved</span>}<Button variant="accent" onClick={save}>Save preferences</Button></div></section>
      <section className="surface p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)]"><Shield className="size-4 text-[var(--accent-dark)]" /></span><div><h2 className="font-[720]">Privacy and retention</h2><p className="text-xs text-[var(--ink-soft)]">Clear controls for sensitive practice data.</p></div></div><div className="mt-6 divide-y divide-[var(--line)]">{[
        { icon: Mic2, label: "Recordings", value: "Automatically delete after 30 days" },
        { icon: Database, label: "Transcripts and analysis", value: "Keep until session or account deletion" },
        { icon: KeyRound, label: "Third-party processing", value: "OpenAI · audio, transcript, metrics, selected frames" },
      ].map((row) => <div key={row.label} className="flex items-center gap-4 py-4"><row.icon className="size-4 text-[var(--ink-soft)]" /><div className="flex-1"><p className="text-sm font-[680]">{row.label}</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{row.value}</p></div></div>)}</div></section>
    </div>
    <aside className="space-y-5">
      <section className="surface p-5">
        <p className="text-sm font-[720]">Current workspace</p>
        <div className={`mt-4 rounded-xl p-4 ${workspace === "demo" ? "bg-[var(--surface-muted)]" : workspace === "guest" ? "bg-[var(--warning-soft)]" : "bg-[var(--success-soft)]"}`}>
          <p className="text-xs font-[700]">{workspace === "demo" ? "Local demo" : workspace === "guest" ? "Temporary guest" : "Saved account"}</p>
          <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{workspace === "demo" ? "Preferences stay in this browser. Sample sessions are never mixed with personal progress." : workspace === "guest" ? "Guest data expires seven days after creation. Save it with an email link to keep it." : "Your preferences and sessions sync to this account."}</p>
        </div>
        {workspace === "guest" ? <ButtonLink href="/auth" variant="secondary" className="mt-4 w-full">Save guest with email</ButtonLink> : workspace === "demo" ? <Button variant="secondary" className="mt-4 w-full" onClick={resetDemo}>Clear local demo preferences</Button> : null}
      </section>
      {workspace !== "demo" && <section className="surface border-[var(--danger-line)] p-5">
        <div className="flex items-center gap-2 text-[var(--danger)]"><AlertTriangle className="size-4" /><p className="text-sm font-[720]">Delete account</p></div>
        <p className="mt-3 text-xs leading-5 text-[var(--ink-soft)]">Permanently removes sessions, media, transcripts, analysis, recommendations, and profile data.</p>
        {deleteError && <p role="alert" className="mt-3 text-xs text-[var(--danger)]">{deleteError}</p>}
        <Dialog.Root><Dialog.Trigger asChild><Button variant="danger" className="mt-4 w-full"><Trash2 className="size-4" /> Delete account</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl"><Dialog.Title className="text-xl font-[740] tracking-[-0.04em]">Delete this account and every session?</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">This cannot be undone. Pulse will remove active database records and private storage objects owned by this account.</Dialog.Description><div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close><Button variant="danger" onClick={deleteAccount} disabled={deleting}>{deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete permanently</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
      </section>}
    </aside>
  </div>;
}
