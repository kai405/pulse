"use client";

import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ChevronRight, CirclePlay, Clock3, Eye, Gauge, Info, LoaderCircle, MessageCircleMore, ShieldCheck, Sparkles, Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { MODE_LABELS } from "@/lib/product";
import { SAMPLE_RESULT } from "@/lib/demo-data";
import type { SessionResultView } from "@/lib/results";
import { formatDate, formatDuration } from "@/lib/utils";

const RESULT_TABS = [["overview", "Overview"], ["transcript", "Transcript & evidence"], ["timeline", "Timeline"]] as const;

function EvidenceText({ text, marks }: { text: string; marks: readonly string[] }) {
  if (!marks.length) return text;
  const lowered = text.toLocaleLowerCase("en-US");
  const ranges = marks.flatMap((mark) => {
    const start = lowered.indexOf(mark.toLocaleLowerCase("en-US"));
    return start >= 0 ? [{ start, end: start + mark.length }] : [];
  }).sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    parts.push(text.slice(cursor, range.start));
    parts.push(<mark key={index} className="rounded bg-[var(--warning-soft)] px-1 text-inherit">{text.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  });
  parts.push(text.slice(cursor));
  return parts;
}

export function SessionResults({ result = SAMPLE_RESULT }: { result?: SessionResultView }) {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState(0);
  const [media, setMedia] = useState<{ url: string; kind: "audio" | "video" } | null>(result.localMedia ?? null);
  const [deleting, setDeleting] = useState<"media" | "session" | null>(null);
  const [dataMessage, setDataMessage] = useState("");
  const mediaRef = useRef<HTMLMediaElement>(null);
  const paceSegments = useMemo(() => [132, 138, 147, 151, 143, 139, 142, 145], []);
  useEffect(() => {
    if (result.isSample || result.isLocal) return;
    const controller = new AbortController();
    fetch(`/api/sessions/${result.id}/media`, { signal: controller.signal }).then(async (response) => response.ok ? response.json() as Promise<{ url: string; kind: "audio" | "video" }> : null).then((value) => { if (value) setMedia(value); }).catch(() => undefined);
    return () => controller.abort();
  }, [result.id, result.isLocal, result.isSample]);
  const seekTo = (time: number) => { setSelectedTime(time); if (mediaRef.current) { mediaRef.current.currentTime = time; void mediaRef.current.play(); } };
  const deleteData = async (kind: "media" | "session") => {
    setDeleting(kind); setDataMessage("");
    const response = await fetch(kind === "media" ? `/api/sessions/${result.id}/media` : `/api/sessions/${result.id}`, { method: "DELETE" });
    if (!response.ok) { setDeleting(null); setDataMessage("Pulse could not complete the deletion. Try again."); return; }
    if (kind === "media") { setMedia(null); setDeleting(null); setDataMessage("Recording deleted. Transcript and feedback remain available."); return; }
    router.push("/history"); router.refresh();
  };
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/history" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-[650] text-[var(--ink-soft)] hover:text-[var(--ink)]"><ArrowLeft className="size-4" /> History</Link>
        <div className="flex items-center gap-2">{result.isSample && <Badge tone="accent">Labeled sample</Badge>}{result.isLocal && <Badge tone="success">Live on-device analysis</Badge>}<Badge>Rubric {result.rubricVersion}</Badge>{!result.isSample && !result.isLocal && <Dialog.Root><Dialog.Trigger asChild><Button variant="ghost" size="sm" className="border border-[var(--line)] bg-white">Manage data</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl"><Dialog.Title className="text-xl font-[740] tracking-[-0.04em]">Manage this session’s data</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Delete only the recording and keep the transcript and feedback, or permanently delete the complete session.</Dialog.Description>{dataMessage && <p role="status" className="mt-4 rounded-xl bg-[var(--surface-muted)] p-3 text-xs leading-5">{dataMessage}</p>}<div className="mt-6 grid gap-2"><Button variant="secondary" onClick={() => void deleteData("media")} disabled={Boolean(deleting)}>{deleting === "media" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete recording only</Button><Button variant="danger" onClick={() => void deleteData("session")} disabled={Boolean(deleting)}>{deleting === "session" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete complete session</Button><Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>}</div>
      </div>
      {result.isSample && <div className="rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-4 py-3 text-xs leading-5 text-[var(--accent-dark)]"><strong>Sample analysis:</strong> This session demonstrates Pulse feedback and is not your recording or progress data.</div>}
      {result.isLocal && <div className="rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] px-4 py-3 text-xs leading-5 text-[var(--success-ink)]"><strong>Live analysis complete:</strong> Pulse scored the microphone and camera signals collected from this recording directly in your browser. The recording has not left this device.</div>}
      {!result.isSample && result.status === "partial" && <div className="rounded-2xl border border-[var(--warning)] bg-[var(--warning-soft)] px-4 py-3 text-xs leading-5 text-[var(--warning)]"><strong>Partial objective result:</strong> This score uses only reliable recorded audio and camera signals. Transcript, fluency, content, and semantic feedback are unavailable and are not estimated.</div>}

      <header className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-soft)]"><span>{MODE_LABELS[result.mode]}</span><span>·</span><span>{formatDate(result.createdAt)}</span><span>·</span><span>{formatDuration(result.durationSeconds)} spoken</span></div><h1 className="mt-3 max-w-4xl text-3xl font-[750] leading-tight tracking-[-0.055em] sm:text-4xl">{result.prompt}</h1></div>
        <ButtonLink href="/practice?focus=fluency" variant="accent" className="shrink-0">Practice the next step <ArrowRight className="size-4" /></ButtonLink>
      </header>

      <Tabs.Root defaultValue="overview" className="mt-8">
        <Tabs.List aria-label="Result sections" className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[var(--line)]">
          {RESULT_TABS.map(([value,label]) => <Tabs.Trigger key={value} value={value} className="min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-[650] text-[var(--ink-soft)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--ink)]">{label}</Tabs.Trigger>)}
        </Tabs.List>

        <Tabs.Content value="overview" className="pt-6 outline-none">
          <section className="surface grid gap-7 p-5 sm:p-7 lg:grid-cols-[auto_1fr] lg:items-center lg:p-9">
            <div className="flex justify-center"><ScoreRing score={result.score ?? 0} /></div>
            <div><div className="flex flex-wrap gap-2">{result.status !== "partial" && <Badge tone="success"><TrendingUp className="mr-1 size-3" /> {(result.score ?? 0) - result.previousScore >= 0 ? "+" : ""}{(result.score ?? 0) - result.previousScore} from previous</Badge>}<Badge>{result.categories.filter((category) => category.confidence === "High").length} high-confidence categories</Badge></div><h2 className="mt-4 text-3xl font-[750] tracking-[-0.05em]">Strongest: {result.strongest}.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{result.summary}</p><div className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] p-4"><Info className="mt-0.5 size-4 shrink-0 text-[var(--navy)]" /><p className="text-xs leading-5 text-[var(--ink-soft)]">Visual scores combine a local head-orientation/framing proxy with sampled-frame evidence. Low-confidence input is removed and category weights are redistributed.</p></div></div>
          </section>

          <section className="mt-5 grid gap-5 [&>*]:min-w-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-sm font-[700]">Score breakdown</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Fixed category weights · mode-aware rubric</p></div><a href="/scoring" className="text-xs font-[680] text-[var(--accent-dark)] hover:underline">How scoring works</a></div><div className="mt-5 space-y-3">{result.categories.map((category) => <details key={category.key} className="group rounded-xl border border-[var(--line)] bg-white p-4"><summary className="flex cursor-pointer list-none items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)] font-mono text-lg font-[720]">{category.score ?? "—"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-[700]">{category.label}</span><span className="mt-1 block truncate text-xs text-[var(--ink-soft)]">{category.summary}</span></span>{category.delta !== null && <span className={`text-xs font-[680] ${category.delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{category.delta >= 0 ? "+" : ""}{category.delta}</span>}<ChevronRight className="size-4 text-[var(--ink-soft)] transition-transform group-open:rotate-90" /></summary><div className="mt-4 border-t border-[var(--line)] pt-4"><div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${category.score ?? 0}%` }} /></div><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{category.score === null ? "This category was not measured in the partial objective result." : category.summary}</p><p className="mt-2 text-xs font-[650] text-[var(--ink-soft)]">Confidence: {category.confidence}</p></div></details>)}</div></div>
            <div className="space-y-5">
              <div className="surface p-5 sm:p-7"><p className="eyebrow">Priority improvement</p><h2 className="mt-3 text-2xl font-[740] tracking-[-0.04em]">{result.priority}</h2>{result.isSample && <div className="mt-5 rounded-xl border-l-4 border-[var(--warning)] bg-[var(--warning-soft)] p-4"><p className="text-xs font-[650] text-[var(--warning)]">Evidence · 00:59</p><p className="mt-2 text-sm leading-6">“<mark className="bg-[var(--warning-mark)]">I think, I think</mark> we could start with six volunteers…”</p></div>}<p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">{result.recommendations[0]?.why ?? "Use the linked evidence to focus the next practice on one observable change."}</p></div>
              <div className="surface p-5 sm:p-7"><p className="text-sm font-[700]">Fast facts</p><div className="mt-5 grid grid-cols-2 gap-3">{[
                { icon: Gauge, label: "Pace", value: result.wpm === null ? "—" : `${result.wpm} WPM`, note: result.wpm === null ? "Transcript unavailable" : "140 target" },
                { icon: MessageCircleMore, label: "Fillers", value: result.fillerRate === null ? "—" : `${result.fillerRate}/min`, note: result.fillerRate === null ? "Transcript unavailable" : `${Math.round(result.fillerRate * result.durationSeconds / 60)} total` },
                { icon: Eye, label: "Engagement", value: result.cameraEngagement === null ? "—" : `${result.cameraEngagement}%`, note: result.cameraEngagement === null ? "Signal unavailable" : "Medium confidence" },
                { icon: Clock3, label: "Duration", value: formatDuration(result.durationSeconds), note: `${Math.round((result.durationSeconds/result.targetSeconds)*100)}% of target` },
              ].map((metric) => <div key={metric.label} className="rounded-xl bg-[var(--surface-muted)] p-3"><metric.icon className="size-4 text-[var(--accent)]" /><p className="mt-3 text-xs text-[var(--ink-soft)]">{metric.label}</p><p className="mt-1 font-mono text-lg font-[720]">{metric.value}</p><p className="mt-0.5 text-[0.68rem] text-[var(--ink-soft)]">{metric.note}</p></div>)}</div></div>
            </div>
          </section>

          <section className="surface mt-5 p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-[700]">Recommendations</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Two actions, ordered by likely impact.</p></div><Sparkles className="size-5 text-[var(--accent)]" /></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{result.recommendations.map((item, index) => <article key={item.title} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex items-center justify-between"><Badge tone={index === 0 ? "accent" : "neutral"}>{item.priority}</Badge><span className="font-mono text-xs text-[var(--ink-soft)]">0{index+1}</span></div><h3 className="mt-5 text-xl font-[720] tracking-[-0.035em]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]"><strong className="text-[var(--ink)]">Why:</strong> {item.why}</p><div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-4 text-sm leading-6"><strong>Practice:</strong> {item.action}</div></article>)}</div></section>

          <section className="surface mt-5 p-5 sm:p-7"><p className="text-sm font-[700]">What worked</p><div className="mt-5 grid gap-3 md:grid-cols-3">{result.strengths.map((strength,index) => <div key={strength} className="flex gap-3 rounded-xl bg-[var(--success-soft)] p-4"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-[750] text-[var(--success)]">{index+1}</span><p className="text-xs leading-5 text-[var(--success-ink)]">{strength}</p></div>)}</div></section>
        </Tabs.Content>

        <Tabs.Content value="transcript" className="pt-6 outline-none">
          <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
            <aside className="surface h-fit overflow-hidden xl:sticky xl:top-6">{media ? media.kind === "video" ? <video ref={mediaRef as React.RefObject<HTMLVideoElement | null>} src={media.url} controls playsInline className="aspect-video w-full bg-[var(--navy)] object-contain" /> : <div className="bg-[var(--navy)] p-5"><audio ref={mediaRef as React.RefObject<HTMLAudioElement | null>} src={media.url} controls className="w-full" /></div> : <div className="aspect-video bg-[var(--navy)] noise-grid"><div className="grid size-full place-items-center text-center text-[var(--ink-on-dark-subtle)]"><div><CirclePlay className="mx-auto size-10" /><p className="mt-3 text-xs font-[650]">{result.isSample ? "Sample media not included" : "Private media unavailable"}</p><p className="mt-1 text-[0.68rem]">Timed transcript evidence remains interactive.</p></div></div></div>}<div className="p-5"><div className="flex items-center justify-between"><span className="font-mono text-sm">{formatDuration(selectedTime)}</span><span className="text-xs text-[var(--ink-soft)]">/ {formatDuration(result.durationSeconds)}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(selectedTime/result.durationSeconds)*100}%` }} /></div><p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">{result.isSample ? "Sample media is omitted; transcript timing is preserved." : "Media access uses a private, one-hour signed URL."}</p></div></aside>
            <section className="surface p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-[700]">Timestamped transcript</p><p className="mt-1 text-xs text-[var(--ink-soft)]">{result.words} words · Click any passage to seek</p></div><div className="flex gap-2"><Badge tone="warning">Fillers & restarts</Badge><Badge tone="success">Strength evidence</Badge></div></div><div className="mt-6 space-y-1">{result.transcript.map((segment) => <button key={segment.id} onClick={() => seekTo(segment.start)} className={`grid w-full gap-2 rounded-xl p-3 text-left transition-colors sm:grid-cols-[58px_1fr] ${selectedTime === segment.start ? "bg-[var(--navy-soft)]" : "hover:bg-[var(--surface-muted)]"}`}><span className="font-mono text-xs text-[var(--ink-soft)]">{formatDuration(segment.start)}</span><span className="text-sm leading-7"><EvidenceText text={segment.text} marks={segment.marks} /></span></button>)}</div><div className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-warm)] p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" /><p className="text-xs leading-5 text-[var(--ink-soft)]">AI evidence excerpts are validated against this persisted transcript. Unsupported excerpts are rejected rather than displayed.</p></div></section>
          </div>
        </Tabs.Content>

        <Tabs.Content value="timeline" className="pt-6 outline-none">
          {result.isSample && <section className="surface p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-[700]">Pace over time</p><p className="mt-1 text-xs text-[var(--ink-soft)]">30-second windows · target 140 WPM</p></div><Badge tone="success">Consistent · 84</Badge></div><div className="mt-8 flex h-44 items-end gap-2 border-b border-[var(--line-strong)] px-1">{paceSegments.map((value,index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-[var(--navy)] transition-colors hover:bg-[var(--accent)]" style={{ height: `${((value-100)/70)*100}%` }}><span className="sr-only">Segment {index+1}: {value} words per minute</span></div></div>)}</div><div className="mt-2 flex justify-between font-mono text-[0.65rem] text-[var(--ink-soft)]"><span>0:00</span><span>0:30</span><span>1:00</span><span>1:30</span><span>1:54</span></div></section>}
          <section className={`${result.isSample ? "mt-5 " : ""}surface p-5 sm:p-7`}><div><p className="text-sm font-[700]">Evidence timeline</p><p className="mt-1 text-xs text-[var(--ink-soft)]">Observable events and evaluator evidence in speaking order.</p></div><div className="relative mt-8 space-y-0 before:absolute before:bottom-5 before:left-[55px] before:top-5 before:w-px before:bg-[var(--line-strong)] sm:before:left-[75px]">{result.timeline.map((event) => <button key={`${event.time}-${event.type}`} onClick={() => seekTo(event.time)} className="relative grid w-full grid-cols-[48px_1fr] gap-5 rounded-xl p-3 text-left hover:bg-[var(--surface-muted)] sm:grid-cols-[68px_1fr]"><span className="font-mono text-xs text-[var(--ink-soft)]">{formatDuration(event.time)}</span><span className="relative flex items-center gap-3 text-sm font-[650]"><span className={`absolute -left-[26px] z-10 size-3 rounded-full border-2 border-white ${event.tone === "success" ? "bg-[var(--success)]" : event.tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--ink-soft)]"}`} /><span className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">{event.label}</span></span></button>)}</div></section>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
