"use client";

import { ArrowRight, Camera, Clock3, Dices, Gauge, Mic2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, MODE_LABELS, PRACTICE_MODES, PREPARATION_DURATIONS, TARGET_DURATIONS, TOPIC_CATEGORIES, type Difficulty, type PracticeMode } from "@/lib/product";
import { getFilteredPrompts } from "@/lib/prompts";
import { formatDuration } from "@/lib/utils";

export type PracticeConfiguration = {
  mode: PracticeMode;
  category: string;
  difficulty: Difficulty;
  promptId: string | null;
  prompt: string;
  targetSeconds: number;
  preparationSeconds: number;
  videoEnabled: boolean;
  focus?: string;
};

export function PracticeSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus") ?? undefined;
  const [mode, setMode] = useState<PracticeMode>("impromptu");
  const [category, setCategory] = useState<string>("Everyday Life");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const prompts = useMemo(() => getFilteredPrompts(mode, category, difficulty), [mode, category, difficulty]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [custom, setCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetSeconds, setTargetSeconds] = useState(120);
  const [preparationSeconds, setPreparationSeconds] = useState(30);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const prompt = prompts[promptIndex % Math.max(1, prompts.length)];

  function randomize() {
    setPromptIndex((current) => (prompts.length <= 1 ? current : (current + 1 + Math.floor(Math.random() * (prompts.length - 1))) % prompts.length));
  }

  function begin() {
    const promptText = custom ? customPrompt.trim() : prompt?.text ?? "";
    if (!promptText) return;
    const config: PracticeConfiguration = { mode, category, difficulty, promptId: custom ? null : prompt?.id ?? null, prompt: promptText, targetSeconds, preparationSeconds, videoEnabled, focus };
    sessionStorage.setItem("pulse-practice-config", JSON.stringify(config));
    router.push("/studio");
  }

  return (
    <div>
      <div><p className="eyebrow">New practice</p><h1 className="mt-3 text-4xl font-[760] tracking-[-0.06em] sm:text-5xl">Set the room, then speak.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">One setup controls the prompt, timing, and capture. Your screen stays quiet once recording begins.</p></div>
      {focus && <div className="mt-6 flex items-center gap-3 rounded-xl border border-[var(--accent-line)] bg-[var(--accent-soft)] p-4 text-sm"><Sparkles className="size-4 text-[var(--accent-dark)]" /><span><strong className="capitalize">{focus}</strong> focus is active. Results will prioritize your clean-transition drill.</span></div>}
      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--navy-soft)] text-[var(--navy)]"><Mic2 className="size-4" /></span><div><h2 className="font-[720]">Practice preset</h2><p className="text-xs text-[var(--ink-soft)]">Changes prompt context—not the score weights.</p></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{PRACTICE_MODES.map((item) => <button key={item} onClick={() => { setMode(item); setPromptIndex(0); }} className={`min-h-12 rounded-xl border px-3 text-sm font-[650] ${mode === item ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"}`} aria-pressed={mode === item}>{MODE_LABELS[item]}</button>)}</div></section>
          <section className="surface p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="font-[720]">Prompt</h2><p className="mt-1 text-xs text-[var(--ink-soft)]">Curated for a useful spoken answer—not filler copy.</p></div><button onClick={() => setCustom((value) => !value)} className="text-xs font-[680] text-[var(--accent-dark)] underline-offset-4 hover:underline">{custom ? "Use curated" : "Write my own"}</button></div>
            {custom ? <div className="mt-5"><label htmlFor="custom-prompt" className="sr-only">Custom prompt</label><textarea id="custom-prompt" value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} maxLength={1000} placeholder="What should you speak about?" className="min-h-36 w-full resize-none rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-warm)] p-5 text-lg font-[620] leading-7 outline-none focus:border-[var(--accent)]" /><p className="mt-2 text-right text-xs text-[var(--ink-soft)]">{customPrompt.length}/1,000</p></div> : <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-[650] text-[var(--ink-soft)]">Topic<select value={category} onChange={(event) => { setCategory(event.target.value); setPromptIndex(0); }} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm text-[var(--ink)]">{TOPIC_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-[650] text-[var(--ink-soft)]">Difficulty<select value={difficulty} onChange={(event) => { setDifficulty(event.target.value as Difficulty); setPromptIndex(0); }} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 text-sm capitalize text-[var(--ink)]">{DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label></div>
              <div className="mt-4 rounded-2xl bg-[var(--navy)] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><Badge className="bg-white/10 text-white capitalize">{difficulty}</Badge><button onClick={randomize} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-[650] text-[var(--ink-on-dark-soft)] hover:bg-white/10 hover:text-white"><Dices className="size-4" /> Another prompt</button></div><p className="mt-8 text-xl font-[650] leading-8 tracking-[-0.03em] sm:text-2xl">{prompt?.text}</p><p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-[var(--ink-on-dark-soft)]">{prompt?.guidance}</p></div>
            </>}
          </section>
          <section className="surface p-5 sm:p-7"><h2 className="font-[720]">Timing</h2><div className="mt-5 grid gap-6 sm:grid-cols-2"><fieldset><legend className="text-xs font-[650] text-[var(--ink-soft)]">Speaking target</legend><div className="mt-2 grid grid-cols-4 gap-2">{TARGET_DURATIONS.map((seconds) => <button key={seconds} onClick={() => setTargetSeconds(seconds)} className={`min-h-11 rounded-xl border text-sm font-[680] ${targetSeconds === seconds ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--line)]"}`}>{formatDuration(seconds)}</button>)}</div></fieldset><fieldset><legend className="text-xs font-[650] text-[var(--ink-soft)]">Preparation</legend><div className="mt-2 grid grid-cols-4 gap-2">{PREPARATION_DURATIONS.map((seconds) => <button key={seconds} onClick={() => setPreparationSeconds(seconds)} className={`min-h-11 rounded-xl border text-sm font-[680] ${preparationSeconds === seconds ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--line)]"}`}>{seconds === 0 ? "Off" : `${seconds}s`}</button>)}</div></fieldset></div></section>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <section className="surface p-5"><h2 className="font-[720]">Capture</h2><button onClick={() => setVideoEnabled((value) => !value)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-[var(--line)] p-4 text-left" aria-pressed={videoEnabled}><span className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-lg ${videoEnabled ? "bg-[var(--navy-soft)] text-[var(--navy)]" : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"}`}><Camera className="size-4" /></span><span><span className="block text-sm font-[680]">Video feedback</span><span className="block text-xs text-[var(--ink-soft)]">{videoEnabled ? "Camera requested next" : "Audio-only session"}</span></span></span><span className={`relative h-6 w-11 rounded-full ${videoEnabled ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${videoEnabled ? "translate-x-6" : "translate-x-1"}`} /></span></button><p className="mt-3 text-xs leading-5 text-[var(--ink-soft)]">Selected frames may be sent for analysis. The complete video is stored privately for 30 days, not sent as a video file.</p></section>
          <section className="surface p-5"><p className="text-xs font-[650] text-[var(--ink-soft)]">Session summary</p><dl className="mt-4 space-y-3 text-sm">{[[Clock3,"Target",formatDuration(targetSeconds)],[Gauge,"Preparation",preparationSeconds ? `${preparationSeconds} sec` : "Off"],[Camera,"Capture",videoEnabled ? "Audio + video" : "Audio only"]].map(([Icon,label,value]) => { const C = Icon as typeof Clock3; return <div key={String(label)} className="flex items-center justify-between"><dt className="flex items-center gap-2 text-[var(--ink-soft)]"><C className="size-4" />{String(label)}</dt><dd className="font-[680]">{String(value)}</dd></div>; })}</dl><Button variant="accent" size="lg" className="mt-6 w-full" onClick={begin} disabled={custom && !customPrompt.trim()}>Check devices <ArrowRight className="size-4" /></Button><p className="mt-3 text-center text-[0.7rem] leading-5 text-[var(--ink-soft)]">Nothing records until after device setup and a visible countdown.</p></section>
        </aside>
      </div>
    </div>
  );
}
