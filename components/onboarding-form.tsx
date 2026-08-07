"use client";

import { ArrowLeft, ArrowRight, Check, Mic2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { MODE_LABELS, PRACTICE_MODES, type PracticeMode } from "@/lib/product";

type Goal = "confidence" | "clarity" | "interviews" | "presentations";
type Experience = "beginner" | "regular" | "advanced";

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("clarity");
  const [experience, setExperience] = useState<Experience>("beginner");
  const [mode, setMode] = useState<PracticeMode>("impromptu");
  const [targetWpm, setTargetWpm] = useState(140);
  const [triggerWords, setTriggerWords] = useState("");
  const [displayName, setDisplayName] = useState("");

  const steps = [
    { label: "Goal", icon: SlidersHorizontal },
    { label: "Practice", icon: Mic2 },
    { label: "Privacy", icon: ShieldCheck },
  ];

  async function complete() {
    const profile = { goal, experience, preferredMode: mode, targetWpm, triggerWords: triggerWords.split(/[,\n]/).map((word) => word.trim()).filter(Boolean), displayName, onboardingCompleted: true };
    window.localStorage.setItem("pulse-profile", JSON.stringify(profile));
    await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...profile, weeklyGoal: 3 }) }).catch(() => undefined);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between"><Logo /><p className="text-xs font-[650] text-[var(--ink-soft)]">About 2 minutes</p></div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[230px_1fr] lg:gap-16">
          <aside>
            <p className="eyebrow">Make Pulse yours</p>
            <ol className="mt-7 flex gap-2 lg:flex-col" aria-label="Onboarding progress">
              {steps.map((item, index) => (
                <li key={item.label} className={`flex flex-1 items-center gap-3 rounded-xl p-3 text-sm font-[650] ${index === step ? "bg-[var(--navy)] text-white" : index < step ? "text-[var(--success)]" : "text-[var(--ink-soft)]"}`} aria-current={index === step ? "step" : undefined}>
                  <span className={`grid size-7 place-items-center rounded-lg ${index < step ? "bg-[var(--success-soft)]" : index === step ? "bg-white/10" : "bg-[var(--surface-muted)]"}`}>{index < step ? <Check className="size-3.5" /> : <item.icon className="size-3.5" />}</span><span className="hidden lg:inline">{item.label}</span>
                </li>
              ))}
            </ol>
          </aside>

          <section className="surface min-h-[560px] p-6 sm:p-9 lg:p-11">
            {step === 0 && (
              <div>
                <p className="text-sm font-[650] text-[var(--accent-dark)]">Step 1 of 3</p>
                <h1 className="mt-3 text-3xl font-[750] tracking-[-0.055em] sm:text-4xl">What should practice improve first?</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">This guides prompts and recommendations. It never changes the evidence behind your score.</p>
                <fieldset className="mt-8"><legend className="text-sm font-[700]">Primary goal</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{[
                  ["clarity", "Clearer ideas", "Make each point easy to follow."],
                  ["confidence", "Confident delivery", "Sound composed and committed."],
                  ["interviews", "Stronger interviews", "Answer directly with evidence."],
                  ["presentations", "Better presentations", "Build structure and presence."],
                ].map(([value,title,copy]) => <label key={value} className={`cursor-pointer rounded-2xl border p-4 ${goal === value ? "border-[var(--navy)] bg-[var(--navy-soft)]" : "border-[var(--line)] bg-white hover:border-[var(--line-strong)]"}`}><input type="radio" name="goal" value={value} checked={goal === value} onChange={() => setGoal(value as Goal)} className="sr-only" /><span className="font-[700]">{title}</span><span className="mt-1 block text-xs leading-5 text-[var(--ink-soft)]">{copy}</span></label>)}</div></fieldset>
                <fieldset className="mt-7"><legend className="text-sm font-[700]">Experience</legend><div className="mt-3 flex flex-wrap gap-2">{[["beginner","Just starting"],["regular","Practice sometimes"],["advanced","Experienced"]].map(([value,label]) => <label key={value} className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-[650] ${experience === value ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--line-strong)] bg-white"}`}><input type="radio" name="experience" className="sr-only" checked={experience === value} onChange={() => setExperience(value as Experience)} />{label}</label>)}</div></fieldset>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-sm font-[650] text-[var(--accent-dark)]">Step 2 of 3</p>
                <h1 className="mt-3 text-3xl font-[750] tracking-[-0.055em] sm:text-4xl">Set your starting point.</h1>
                <div className="mt-8 grid gap-7">
                  <fieldset><legend className="text-sm font-[700]">Preferred practice</legend><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{PRACTICE_MODES.map((item) => <label key={item} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-[650] ${mode === item ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "border-[var(--line)]"}`}><input className="sr-only" type="radio" name="mode" checked={mode === item} onChange={() => setMode(item)} />{MODE_LABELS[item]}</label>)}</div></fieldset>
                  <div><label htmlFor="pace" className="text-sm font-[700]">Target pace <span className="font-normal text-[var(--ink-soft)]">({targetWpm} WPM)</span></label><input id="pace" type="range" min="100" max="180" step="5" value={targetWpm} onChange={(event) => setTargetWpm(Number(event.target.value))} className="mt-4 w-full accent-[var(--accent)]" /><div className="mt-1 flex justify-between text-xs text-[var(--ink-soft)]"><span>Measured · 100</span><span>Conversational · 140</span><span>Energetic · 180</span></div></div>
                  <div><label htmlFor="name" className="text-sm font-[700]">Display name <span className="font-normal text-[var(--ink-soft)]">optional</span></label><input id="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} placeholder="What should Pulse call you?" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm" /></div>
                  <div><label htmlFor="triggers" className="text-sm font-[700]">Personal trigger words <span className="font-normal text-[var(--ink-soft)]">optional</span></label><textarea id="triggers" value={triggerWords} onChange={(event) => setTriggerWords(event.target.value)} maxLength={250} placeholder="e.g. basically, at the end of the day" className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[var(--line-strong)] bg-white p-4 text-sm" /><p className="mt-1.5 text-xs text-[var(--ink-soft)]">Separate phrases with commas. They are counted but never automatically penalized.</p></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-sm font-[650] text-[var(--accent-dark)]">Step 3 of 3</p>
                <h1 className="mt-3 text-3xl font-[750] tracking-[-0.055em] sm:text-4xl">Know what happens to a recording.</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Pulse asks for device permission only when you enter setup. Nothing records during onboarding.</p>
                <div className="mt-8 space-y-3">{[
                  ["In your browser", "Camera landmarks, movement signals, vocal energy, and selected frames are derived locally."],
                  ["Sent for analysis", "Audio is transcribed. Transcript, metrics, and up to 48 selected frames are evaluated through OpenAI."],
                  ["Stored privately", "Audio and video expire after 30 days. Transcript and feedback remain until you delete the session."],
                  ["Never inferred", "Pulse does not judge emotion, personality, honesty, attractiveness, accent, or internal confidence."],
                ].map(([title,copy], index) => <div key={title} className="flex gap-4 rounded-xl border border-[var(--line)] bg-white p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-xs font-[750] text-[var(--success)]">{index+1}</span><div><p className="text-sm font-[700]">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{copy}</p></div></div>)}</div>
                <p className="mt-5 text-xs leading-5 text-[var(--ink-soft)]">OpenAI API content is not used for model training by default; provider abuse-monitoring retention may last up to 30 days. <a href="/privacy" target="_blank" className="font-[650] underline underline-offset-2">Read the full summary</a>.</p>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-6">
              <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft className="size-4" /> Back</Button>
              {step < 2 ? <Button variant="accent" onClick={() => setStep((current) => Math.min(2, current + 1))}>Continue <ArrowRight className="size-4" /></Button> : <Button variant="accent" onClick={() => void complete()}>I understand — continue <ArrowRight className="size-4" /></Button>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
