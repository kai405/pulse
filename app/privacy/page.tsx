import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing-nav";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main>
      <MarketingNav />
      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        <Badge tone="accent">Plain-language summary</Badge>
        <h1 className="mt-6 text-5xl font-[760] tracking-[-0.065em]">Your practice stays yours.</h1>
        <p className="mt-6 text-lg leading-8 text-[var(--ink-soft)]">Pulse records only after clear permission, keeps sessions private, and makes deletion available where you review the data.</p>
        <div className="mt-12 space-y-9">
          {[
            ["What leaves your browser", "Audio is sent for transcription. Up to 48 timestamped frames—not your complete video file—may be sent for qualitative visual feedback. Transcript text and objective metrics are sent for structured evaluation."],
            ["What Pulse stores", "Private audio and video are stored for replay for 30 days. Transcripts, scores, metrics, and feedback remain until you delete the session or account. Guest data expires after seven days."],
            ["Third-party processing", "OpenAI processes audio, transcript text, metrics, and selected frames. API content is not used for training by default, while provider abuse-monitoring logs may retain customer content for up to 30 days."],
            ["Deletion", "Deleting a session removes its media, transcript, frames, analysis, and recommendations. You can instead delete only the recording and keep transcript-derived results."],
            ["What Pulse will not infer", "Pulse does not score emotion, personality, honesty, attractiveness, accent quality, or internal confidence. Camera engagement is a head-orientation proxy, not literal eye tracking."],
          ].map(([title, copy]) => (
            <section key={title} className="border-t border-[var(--line)] pt-7"><h2 className="text-lg font-[720] tracking-[-0.025em]">{title}</h2><p className="mt-3 leading-7 text-[var(--ink-soft)]">{copy}</p></section>
          ))}
        </div>
      </article>
    </main>
  );
}
