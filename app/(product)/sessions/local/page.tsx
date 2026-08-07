"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { SessionResults } from "@/components/session-results";
import { ButtonLink } from "@/components/ui/button";
import type { SessionResultView } from "@/lib/results";

export default function LocalSessionPage() {
  const [result, setResult] = useState<SessionResultView | null | undefined>(undefined);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const raw = sessionStorage.getItem("pulse-local-session-result");
      if (!raw) { setResult(null); return; }
      try { setResult(JSON.parse(raw) as SessionResultView); }
      catch { setResult(null); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (result === undefined) return <div className="grid min-h-80 place-items-center"><LoaderCircle className="size-6 animate-spin text-[var(--accent)]" /><span className="sr-only">Loading live analysis</span></div>;
  if (!result) return <section className="surface p-8 text-center"><h1 className="text-2xl font-[740]">This local result is no longer in this tab.</h1><p className="mt-3 text-sm text-[var(--ink-soft)]">Record another response to generate a fresh private analysis.</p><ButtonLink href="/practice" variant="accent" className="mt-6">Start a practice</ButtonLink></section>;
  return <SessionResults result={result} />;
}
