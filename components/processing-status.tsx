"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, FileAudio, FileText, LoaderCircle, RefreshCcw, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Button, ButtonLink } from "@/components/ui/button";

type StatusResponse = { id: string; status: string; current_stage: string | null; failure_code: string | null; failure_message: string | null; updated_at: string };

const STAGES = [
  { key: "queued", label: "Recording secured", icon: FileAudio },
  { key: "transcribing", label: "Creating timestamped transcript", icon: FileText },
  { key: "measuring", label: "Calculating delivery metrics", icon: RefreshCcw },
  { key: "evaluating", label: "Evaluating ideas and sampled frames", icon: Sparkles },
  { key: "finalizing", label: "Validating evidence and scores", icon: Check },
] as const;

const ORDER = ["queued", "transcribing", "measuring", "evaluating", "finalizing", "completed", "partial"];

export function ProcessingStatus({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const query = useQuery({
    queryKey: ["session-status", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/status`, { cache: "no-store" });
      const data = (await response.json()) as StatusResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Status unavailable");
      return data;
    },
    refetchInterval: (state) => ["completed", "partial", "failed", "incomplete"].includes(state.state.data?.status ?? "") ? false : 1500,
  });
  const status = query.data?.status ?? "queued";
  const currentIndex = ORDER.indexOf(query.data?.current_stage ?? status);

  useEffect(() => {
    if (status === "completed" || status === "partial") router.replace(`/sessions/${sessionId}`);
  }, [router, sessionId, status]);

  async function retry() {
    setRetrying(true);
    const response = await fetch(`/api/sessions/${sessionId}/retry`, { method: "POST" });
    if (response.ok) await query.refetch();
    setRetrying(false);
  }

  async function deleteSession() {
    setDeleting(true);
    setDeleteError("");
    const response = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/history");
      router.refresh();
      return;
    }
    setDeleteError("Pulse could not delete this session. Try again.");
    setDeleting(false);
  }

  const deleteControl = <Dialog.Root><Dialog.Trigger asChild><Button variant="ghost"><Trash2 className="size-4" /> Delete session</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white p-6 text-left shadow-2xl"><Dialog.Title className="text-xl font-[740] tracking-[-0.04em]">Delete this practice session?</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">This permanently removes its recording, captured frames, transcript, and analysis data. It cannot be undone.</Dialog.Description>{deleteError && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close><Button variant="danger" onClick={deleteSession} disabled={deleting}>{deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete permanently</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;

  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-5xl"><Logo href="/dashboard" /><div className="mx-auto mt-16 max-w-xl text-center sm:mt-24">
        {status === "failed" || query.isError ? <>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--danger-icon-soft)] text-[var(--danger)]"><AlertTriangle className="size-6" /></span>
          <h1 className="mt-6 text-3xl font-[750] tracking-[-0.055em]">Analysis stopped, but your session is safe.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{query.data?.failure_message ?? query.error?.message ?? "Pulse could not retrieve the processing status."}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button variant="accent" onClick={retry} disabled={retrying}>{retrying ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />} Retry analysis</Button><ButtonLink href="/sessions/sample-community-change" variant="secondary">View sample results</ButtonLink>{deleteControl}</div>
        </> : status === "incomplete" ? <>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--warning-soft)] text-[var(--warning)]"><AlertTriangle className="size-6" /></span>
          <h1 className="mt-6 text-3xl font-[750] tracking-[-0.055em]">Not enough speech to score responsibly.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Pulse needs at least 10 seconds and 20 transcribed words. This attempt remains saved as incomplete, without a misleading score.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/practice" variant="accent">Try another practice</ButtonLink>{deleteControl}</div>
        </> : <>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-dark)]"><LoaderCircle className="size-6 animate-spin" /></span>
          <p className="eyebrow mt-6">Analysis in progress</p>
          <h1 className="mt-3 text-3xl font-[750] tracking-[-0.055em] sm:text-4xl">Turning your practice into evidence.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">You can safely leave this page. Pulse stores each completed stage and will resume here when you return.</p>
          <div className="surface mt-9 p-4 text-left sm:p-6">{STAGES.map((stage, index) => { const complete = currentIndex > index || status === "completed" || status === "partial"; const active = currentIndex === index; return <div key={stage.key} className="flex min-h-14 items-center gap-4 border-b border-[var(--line)] last:border-0"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${complete ? "bg-[var(--success-soft)] text-[var(--success)]" : active ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]" : "bg-[var(--surface-muted)] text-[var(--ink-soft)]"}`}>{complete ? <Check className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin" /> : <stage.icon className="size-4" />}</span><span className={`text-sm font-[650] ${!complete && !active ? "text-[var(--ink-soft)]" : ""}`}>{stage.label}</span>{active && <span className="ml-auto text-xs text-[var(--ink-soft)]">Working…</span>}</div>; })}</div>
          <p className="mt-5 text-xs leading-5 text-[var(--ink-soft)]">These are real processing stages, not an estimated percentage.</p>
        </>}
      </div></div>
    </main>
  );
}
