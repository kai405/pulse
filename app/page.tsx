import { ArrowRight, AudioLines, Camera, ChartNoAxesCombined, Check, LockKeyhole, Quote } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { ResultPreview } from "@/components/result-preview";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { number: "01", title: "Choose your challenge", copy: "Pick an interview, pitch, presentation, or impromptu prompt—and set the time you want to hold the room." },
  { number: "02", title: "Speak without distraction", copy: "Pulse keeps the studio quiet: your prompt, time, camera preview, and nothing that changes how you naturally speak." },
  { number: "03", title: "See the evidence", copy: "Every insight points back to the exact words, pause, pace shift, vocal pattern, or sampled frame that supports it." },
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <MarketingNav />
      <section className="relative mx-auto grid min-h-[730px] max-w-[1200px] items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="relative z-10">
          <Badge tone="accent" className="mb-6">Public speaking practice, measured</Badge>
          <h1 className="text-balance max-w-[660px] text-[clamp(3.4rem,7vw,6.8rem)] font-[760] leading-[0.89] tracking-[-0.075em]">
            Practice with <span className="text-[var(--accent)]">proof.</span>
          </h1>
          <p className="mt-7 max-w-[590px] text-balance text-lg leading-8 text-[var(--ink-soft)] sm:text-xl">
            Record a speech. See exactly where your delivery helped—or held back—your idea. Leave with one action worth practicing next.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/auth" variant="accent" size="lg">
              Start a practice <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/sessions/sample-community-change" variant="secondary" size="lg">
              Explore a sample analysis
            </ButtonLink>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-[620] text-[var(--ink-soft)]">
            {['No credit card', 'Audio-only available', 'Private by default'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-[var(--success)]" aria-hidden="true" />{item}</span>
            ))}
          </div>
        </div>
        <div className="relative lg:pl-5">
          <div className="noise-grid absolute -right-40 -top-32 -z-10 size-[650px] rounded-full opacity-60 [mask-image:radial-gradient(circle,black,transparent_68%)]" />
          <ResultPreview />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[var(--line)] bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow !text-[var(--accent-pale)]">One focused loop</p>
              <h2 className="mt-4 max-w-lg text-4xl font-[740] leading-[1.04] tracking-[-0.055em] sm:text-5xl">Less dashboard. More deliberate practice.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[var(--ink-on-dark-soft)] lg:justify-self-end">Pulse measures what a browser can observe, asks AI to interpret only what requires judgment, and shows the boundary between the two.</p>
          </div>
          <div className="mt-14 grid border-t border-white/15 md:grid-cols-3">
            {STEPS.map((step) => (
              <article key={step.number} className="border-b border-white/15 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <span className="font-mono text-xs text-[var(--accent-pale)]">{step.number}</span>
                <h3 className="mt-8 text-xl font-[700] tracking-[-0.035em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-on-dark-subtle)]">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="feedback" className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="eyebrow">Feedback you can verify</p>
            <h2 className="mt-4 max-w-xl text-4xl font-[740] leading-[1.05] tracking-[-0.055em] sm:text-5xl">Not “be more confident.” Here’s the moment to change.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)]">Pulse separates measurable facts from interpretation. Low-confidence signals are explained and removed from your score—not quietly counted against you.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { icon: AudioLines, title: "Delivery", text: "Pace, pauses, fillers, repetition, vocal variation." },
                { icon: Camera, title: "Presence", text: "Camera engagement, framing, and visible movement." },
                { icon: ChartNoAxesCombined, title: "Progress", text: "Compatible baselines and recurring habits over time." },
              ].map((item) => (
                <div key={item.title} className="surface p-4 shadow-none">
                  <item.icon className="size-5 text-[var(--accent)]" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-[720]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="surface overflow-hidden p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
              <div><p className="text-xs font-[650] text-[var(--ink-soft)]">Transcript evidence · 00:59</p><p className="mt-1 text-sm font-[720]">Fluency</p></div>
              <Badge tone="warning">Restart phrase</Badge>
            </div>
            <blockquote className="relative py-10 pl-8 text-2xl font-[590] leading-[1.55] tracking-[-0.035em] sm:pl-12 sm:text-3xl">
              <Quote className="absolute left-0 top-10 size-6 text-[var(--line-strong)]" aria-hidden="true" />
              “<mark className="rounded bg-[var(--warning-soft)] px-1 text-inherit">I think, I think</mark> we could start with six volunteers and a room the library already offers for free.”
            </blockquote>
            <div className="rounded-2xl bg-[var(--surface-muted)] p-5">
              <p className="text-sm font-[720]">Try this next</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Take one silent breath before each new section. The pause will make the implementation point feel intentional instead of tentative.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="surface grid overflow-hidden lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="grid size-24 place-items-center bg-[var(--navy)] text-white lg:size-32"><LockKeyhole className="size-8" aria-hidden="true" /></div>
          <div className="p-6 sm:p-8">
            <p className="eyebrow">Private practice means private</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">Recordings are private, expire after 30 days, and can be deleted sooner. Pulse tells you when audio or selected video frames leave your browser and never uses hidden consent.</p>
          </div>
          <div className="px-6 pb-6 sm:px-8 lg:p-8"><ButtonLink href="/privacy" variant="secondary">Read the privacy summary</ButtonLink></div>
        </div>
      </section>

      <section className="bg-[var(--accent)] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div><p className="text-sm font-[650] text-white/80">Your next speech is practiceable.</p><h2 className="mt-2 text-3xl font-[740] tracking-[-0.05em] sm:text-4xl">Make the next two minutes count.</h2></div>
          <ButtonLink href="/auth" variant="secondary" size="lg" className="border-white bg-white hover:bg-[var(--accent-ghost)]">Start a practice <ArrowRight className="size-4" aria-hidden="true" /></ButtonLink>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 text-xs text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p>© 2026 Pulse. Feedback for practice—not a judgment of the person.</p>
        <div className="flex gap-5"><a href="/privacy">Privacy</a><a href="/scoring">How scoring works</a></div>
      </footer>
    </main>
  );
}
