"use client";

import { AlertTriangle, ArrowLeft, Camera, Check, Clock3, LoaderCircle, Mic2, RefreshCcw, ShieldCheck, Square, VideoOff, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeConfiguration } from "@/components/practice-setup";
import { Button, ButtonLink } from "@/components/ui/button";
import { createFrame, chooseMimeType, describeMediaError } from "@/lib/media/recording";
import { startVisionAnalyzer, type VisualSample } from "@/lib/media/vision-analyzer";
import { createLocalSessionResult } from "@/lib/scoring/local-result";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatDuration } from "@/lib/utils";

type Phase = "loading" | "preflight" | "ready" | "preparing" | "countdown" | "recording" | "captured" | "uploading" | "error";
type AudioSample = { timestampMs: number; rms: number; clipping: boolean };
type FrameSample = { timestampMs: number; dataUrl: string };

export function RecordingStudio() {
  const router = useRouter();
  const [config, setConfig] = useState<PracticeConfiguration | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceError, setDeviceError] = useState("");
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [uploadError, setUploadError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const startedAtRef = useRef(0);
  const audioSamplesRef = useRef<AudioSample[]>([]);
  const visualSamplesRef = useRef<VisualSample[]>([]);
  const frameSamplesRef = useRef<FrameSample[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const visionCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const animation = requestAnimationFrame(() => {
      const raw = sessionStorage.getItem("pulse-practice-config");
      if (!raw) { router.replace("/practice"); return; }
      try { setConfig(JSON.parse(raw) as PracticeConfiguration); setPhase("preflight"); } catch { router.replace("/practice"); }
    });
    return () => cancelAnimationFrame(animation);
  }, [router]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
    streamRef.current = stream;
  }, [stream, phase]);

  useEffect(() => {
    const preventNavigation = (event: BeforeUnloadEvent) => {
      if (phase === "recording" || phase === "uploading") { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", preventNavigation);
    return () => window.removeEventListener("beforeunload", preventNavigation);
  }, [phase]);

  useEffect(() => () => {
    audioCleanupRef.current?.(); audioCleanupRef.current = null;
    visionCleanupRef.current?.(); visionCleanupRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!cameraAvailable || !stream || !videoRef.current) return;
    let cancelled = false;
    const video = videoRef.current;
    const begin = async () => {
      try {
        await video.play();
        const cleanup = await startVisionAnalyzer(video, (sample) => {
          if (!startedAtRef.current || visualSamplesRef.current.length >= 3_000) return;
          const timestampMs = performance.now() - startedAtRef.current;
          visualSamplesRef.current.push({ ...sample, timestampMs });
          const lastFrameAt = frameSamplesRef.current.at(-1)?.timestampMs ?? -5_000;
          if (sample.faceDetected && !sample.cameraEngaged && timestampMs - lastFrameAt >= 1_500 && frameSamplesRef.current.length < 48) {
            const dataUrl = createFrame(video);
            if (dataUrl) frameSamplesRef.current.push({ timestampMs: Math.round(timestampMs), dataUrl });
          }
        });
        if (cancelled) cleanup(); else visionCleanupRef.current = cleanup;
      } catch {
        // Visual scoring remains unavailable if the local model cannot load.
      }
    };
    void begin();
    return () => { cancelled = true; visionCleanupRef.current?.(); visionCleanupRef.current = null; };
  }, [cameraAvailable, stream]);

  const startMeter = useCallback((mediaStream: MediaStream) => {
    audioCleanupRef.current?.();
    const context = new AudioContext();
    const source = context.createMediaStreamSource(mediaStream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let animation = 0;
    const sample = () => {
      analyser.getByteTimeDomainData(data);
      const sum = data.reduce((total, value) => total + ((value - 128) / 128) ** 2, 0);
      const rms = Math.sqrt(sum / data.length);
      setAudioLevel(Math.min(1, rms * 5));
      if (startedAtRef.current) audioSamplesRef.current.push({ timestampMs: performance.now() - startedAtRef.current, rms, clipping: data.some((value) => value <= 1 || value >= 254) });
      animation = requestAnimationFrame(sample);
    };
    sample();
    let cleaned = false;
    audioCleanupRef.current = () => {
      if (cleaned) return;
      cleaned = true;
      cancelAnimationFrame(animation);
      source.disconnect();
      if (context.state !== "closed") void context.close().catch(() => undefined);
    };
  }, []);

  async function checkDevices() {
    if (!config) return;
    setDeviceError("");
    stream?.getTracks().forEach((track) => track.stop());
    try {
      const requested = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: config.videoEnabled ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false });
      setStream(requested); setCameraAvailable(requested.getVideoTracks().length > 0); startMeter(requested); setPhase("ready");
    } catch (error) {
      if (config.videoEnabled) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
          setStream(audioOnly); setCameraAvailable(false); startMeter(audioOnly); setDeviceError("Camera access failed, but your microphone is ready. You can continue audio-only or retry camera access."); setPhase("ready"); return;
        } catch (audioError) { setDeviceError(describeMediaError(audioError)); }
      } else setDeviceError(describeMediaError(error));
    }
  }

  function runCountdown(seconds: number, next: () => void, nextPhase: Phase) {
    if (seconds <= 0) { next(); return; }
    setPhase(nextPhase); setCountdown(seconds);
    let remaining = seconds;
    const timer = window.setInterval(() => { remaining -= 1; setCountdown(remaining); if (remaining <= 0) { window.clearInterval(timer); next(); } }, 1000);
  }

  function beginSequence() {
    if (!config) return;
    runCountdown(config.preparationSeconds, () => runCountdown(5, startRecording, "countdown"), "preparing");
  }

  function startRecording() {
    if (!stream || !config) return;
    const audioChunks: BlobPart[] = [];
    const videoChunks: BlobPart[] = [];
    const audioStream = new MediaStream(stream.getAudioTracks());
    const audioMime = chooseMimeType("audio");
    const audioRecorder = new MediaRecorder(audioStream, audioMime ? { mimeType: audioMime, audioBitsPerSecond: 96_000 } : undefined);
    audioRecorder.ondataavailable = (event) => { if (event.data.size) audioChunks.push(event.data); };
    audioRecorder.onstop = () => setAudioBlob(new Blob(audioChunks, { type: audioRecorder.mimeType || "audio/webm" }));
    try {
      audioRecorder.start(1000);
    } catch {
      setDeviceError("This browser could not start recording from the selected microphone. Check the device again or try a current Chrome, Edge, or Firefox release.");
      setPhase("ready");
      return;
    }
    audioRecorderRef.current = audioRecorder;
    if (cameraAvailable) {
      const videoMime = chooseMimeType("video");
      const recorder = new MediaRecorder(stream, videoMime ? { mimeType: videoMime, videoBitsPerSecond: 1_000_000, audioBitsPerSecond: 64_000 } : undefined);
      recorder.ondataavailable = (event) => { if (event.data.size) videoChunks.push(event.data); };
      recorder.onstop = () => setVideoBlob(new Blob(videoChunks, { type: recorder.mimeType || "video/webm" }));
      try {
        recorder.start(1000);
        videoRecorderRef.current = recorder;
      } catch {
        setCameraAvailable(false);
        setDeviceError("Camera preview is available, but video recording could not start. Pulse will continue with audio-only feedback.");
      }
    }
    audioSamplesRef.current = []; visualSamplesRef.current = []; frameSamplesRef.current = []; startedAtRef.current = performance.now(); setElapsed(0); setPhase("recording");
  }

  useEffect(() => {
    if (phase !== "recording") return;
    const frameInterval = Math.max(5, Math.ceil((config?.targetSeconds ?? 240) / 46));
    const timer = window.setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAtRef.current) / 1000); setElapsed(seconds);
      if (cameraAvailable && seconds > 0 && seconds % frameInterval === 0 && frameSamplesRef.current.at(-1)?.timestampMs !== seconds * 1000 && videoRef.current) {
        const dataUrl = createFrame(videoRef.current); if (dataUrl && frameSamplesRef.current.length < 48) frameSamplesRef.current.push({ timestampMs: seconds * 1000, dataUrl });
      }
      if (seconds >= 600) finishRecording();
    }, 250);
    return () => window.clearInterval(timer);
  });

  function finishRecording() {
    if (audioRecorderRef.current?.state === "recording") audioRecorderRef.current.stop();
    if (videoRecorderRef.current?.state === "recording") videoRecorderRef.current.stop();
    startedAtRef.current = 0; setPhase("captured");
  }

  function restart() {
    if (audioRecorderRef.current?.state === "recording") audioRecorderRef.current.stop();
    if (videoRecorderRef.current?.state === "recording") videoRecorderRef.current.stop();
    setAudioBlob(null); setVideoBlob(null); setElapsed(0); setUploadError(""); audioSamplesRef.current = []; visualSamplesRef.current = []; frameSamplesRef.current = []; setPhase("ready");
  }

  async function upload() {
    if (!audioBlob || !config) return;
    setPhase("uploading"); setUploadError("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        const mediaBlob = videoBlob ?? audioBlob;
        const result = createLocalSessionResult({
          config,
          durationSeconds: elapsed,
          audioSamples: audioSamplesRef.current,
          visualSamples: visualSamplesRef.current,
          localMedia: mediaBlob ? { url: URL.createObjectURL(mediaBlob), kind: videoBlob ? "video" : "audio" } : undefined,
        });
        sessionStorage.setItem("pulse-local-session-result", JSON.stringify(result));
        router.push("/sessions/local");
        return;
      }
      const response = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ config, durationSeconds: elapsed, audio: { mime: audioBlob.type, bytes: audioBlob.size }, video: videoBlob ? { mime: videoBlob.type, bytes: videoBlob.size } : null, frameTimestamps: frameSamplesRef.current.map((frame) => frame.timestampMs) }) });
      const data = (await response.json()) as { id?: string; error?: string; uploads?: { audio: { path: string; token: string }; video: { path: string; token: string } | null; frames: ({ timestampMs: number; path: string; token: string } | null)[] } };
      if (!response.ok || !data.id || !data.uploads) { setUploadError(data.error ?? "Pulse could not reserve private storage."); setPhase("error"); return; }
      const audioUpload = await supabase.storage.from("recordings").uploadToSignedUrl(data.uploads.audio.path, data.uploads.audio.token, audioBlob, { contentType: audioBlob.type });
      if (audioUpload.error) throw new Error("AUDIO_UPLOAD_FAILED");
      if (videoBlob && data.uploads.video) {
        const videoUpload = await supabase.storage.from("recordings").uploadToSignedUrl(data.uploads.video.path, data.uploads.video.token, videoBlob, { contentType: videoBlob.type });
        if (videoUpload.error) throw new Error("VIDEO_UPLOAD_FAILED");
      }
      const uploadedFrames: { timestampMs: number; path: string }[] = [];
      for (const [index, target] of data.uploads.frames.entries()) {
        const sample = frameSamplesRef.current[index];
        if (!target || !sample) continue;
        const frameBlob = await (await fetch(sample.dataUrl)).blob();
        const frameUpload = await supabase.storage.from("analysis-frames").uploadToSignedUrl(target.path, target.token, frameBlob, { contentType: "image/jpeg" });
        if (!frameUpload.error) uploadedFrames.push({ timestampMs: target.timestampMs, path: target.path });
      }
      const complete = await fetch(`/api/sessions/${data.id}/complete-upload`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ durationSeconds: elapsed, audioSamples: audioSamplesRef.current, visualSamples: visualSamplesRef.current, frames: uploadedFrames }) });
      const completion = (await complete.json()) as { error?: string };
      if (!complete.ok) { setUploadError(completion.error ?? "The media was saved, but analysis could not start. Retry from history."); setPhase("error"); return; }
      router.push(`/sessions/${data.id}/processing`);
    } catch { setUploadError("The connection was interrupted. Your recording is still in this tab—retry when you’re online."); setPhase("error"); }
  }

  if (!config || phase === "loading") return <main className="grid min-h-screen place-items-center"><LoaderCircle className="size-6 animate-spin text-[var(--accent)]" /><span className="sr-only">Loading studio</span></main>;

  const targetProgress = Math.min(100, (elapsed / config.targetSeconds) * 100);
  return (
    <main className="min-h-screen bg-[var(--navy)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-4 sm:px-7 lg:px-10 lg:py-6">
        <header className="flex items-center justify-between"><Link href="/practice" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-[650] text-[var(--ink-on-dark-soft)] hover:bg-white/10 hover:text-white"><ArrowLeft className="size-4" /> Back to setup</Link><div className="flex items-center gap-2 text-xs font-[650] text-[var(--ink-on-dark-soft)]"><ShieldCheck className="size-4" /> Private practice</div></header>
        <div className="flex flex-1 items-center py-6">
          <div className="grid w-full gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="relative min-h-[480px] overflow-hidden rounded-[1.6rem] bg-[var(--studio)] lg:min-h-[650px]">
              {cameraAvailable && stream ? <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full object-cover [transform:scaleX(-1)]" /> : <div className="absolute inset-0 grid place-items-center noise-grid"><div className="text-center text-[var(--ink-on-dark-muted)]"><VideoOff className="mx-auto size-10" /><p className="mt-3 text-sm font-[650]">Audio-only practice</p></div></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--studio-deep)]/80 via-transparent to-[color:var(--studio-deep)]/35" />
              {(phase === "preparing" || phase === "countdown") && <div className="absolute inset-0 z-10 grid place-items-center bg-[color:var(--studio-deep)]/75 backdrop-blur-sm"><div className="text-center"><p className="text-sm font-[680] uppercase tracking-[0.15em] text-[var(--ink-on-dark-subtle)]">{phase === "preparing" ? "Prepare" : "Recording starts in"}</p><p className="mt-5 font-mono text-8xl font-[700] tracking-[-0.08em]">{countdown}</p><p className="mx-auto mt-6 max-w-md px-5 text-sm leading-6 text-[var(--ink-on-dark-soft)]">{config.prompt}</p></div></div>}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-[650] text-[var(--ink-on-dark-subtle)]">Your prompt</p><p className="mt-2 max-w-2xl text-xl font-[620] leading-7 tracking-[-0.025em] sm:text-2xl">{config.prompt}</p></div>{phase === "recording" && <span className="shrink-0 rounded-full bg-[var(--danger)] px-3 py-1.5 text-xs font-[720]"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-white" />Recording</span>}</div>
              </div>
            </section>
            <section className="flex flex-col rounded-[1.6rem] bg-[var(--canvas)] p-5 text-[var(--ink)] sm:p-7 lg:p-8">
              {(phase === "preflight" || phase === "ready") && <>
                <div><p className="eyebrow">Device check</p><h1 className="mt-4 text-3xl font-[750] tracking-[-0.055em]">Make sure Pulse can hear you.</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Your browser will ask once. Recording starts only after preparation and a visible five-second countdown.</p></div>
                <div className="mt-8 space-y-3"><div className={`flex items-center justify-between rounded-xl border p-4 ${stream ? "border-[var(--success-line)] bg-[var(--success-soft)]" : "border-[var(--line)] bg-white"}`}><span className="flex items-center gap-3"><Mic2 className="size-5" /><span><span className="block text-sm font-[700]">Microphone</span><span className="block text-xs text-[var(--ink-soft)]">{stream ? "Ready and receiving input" : "Required for practice"}</span></span></span>{stream && <Check className="size-5 text-[var(--success)]" />}</div><div className={`flex items-center justify-between rounded-xl border p-4 ${cameraAvailable ? "border-[var(--success-line)] bg-[var(--success-soft)]" : "border-[var(--line)] bg-white"}`}><span className="flex items-center gap-3"><Camera className="size-5" /><span><span className="block text-sm font-[700]">Camera</span><span className="block text-xs text-[var(--ink-soft)]">{cameraAvailable ? "Ready for visual feedback" : config.videoEnabled ? "Recommended, not required" : "Audio-only selected"}</span></span></span>{cameraAvailable && <Check className="size-5 text-[var(--success)]" />}</div></div>
                {stream && <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4"><div className="flex items-center justify-between text-xs"><span className="font-[650]">Input level</span><span className={audioLevel > 0.02 ? "text-[var(--success)]" : "text-[var(--warning)]"}>{audioLevel > 0.02 ? "We can hear you" : "Say a few words"}</span></div><div className="mt-3 flex h-8 items-end gap-1" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} className="flex-1 rounded-sm bg-[var(--accent)] transition-[height]" style={{ height: `${Math.max(10, Math.min(100, audioLevel * 120 - Math.abs(12-index) * 3 + 25))}%`, opacity: 0.35 + index/48 }} />)}</div></div>}
                {deviceError && <div role="status" className="mt-4 flex gap-3 rounded-xl border border-[var(--warning-line)] bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{deviceError}</div>}
                <div className="mt-auto pt-8">{phase === "preflight" ? <Button variant="accent" size="lg" className="w-full" onClick={checkDevices}><Mic2 className="size-4" /> Check microphone and camera</Button> : <div className="grid gap-3"><Button variant="accent" size="lg" className="w-full" onClick={beginSequence}>Begin preparation</Button><Button variant="ghost" className="w-full" onClick={checkDevices}><RefreshCcw className="size-4" /> Check devices again</Button></div>}</div>
              </>}

              {phase === "recording" && <><div className="text-center"><p className="text-xs font-[650] uppercase tracking-[0.14em] text-[var(--ink-soft)]">Elapsed</p><p className="mt-3 font-mono text-7xl font-[700] tracking-[-0.08em]">{formatDuration(elapsed)}</p><p className="mt-2 text-sm text-[var(--ink-soft)]">Target {formatDuration(config.targetSeconds)}</p></div><div className="mt-10"><div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className={`h-full rounded-full ${elapsed > config.targetSeconds ? "bg-[var(--warning)]" : "bg-[var(--accent)]"}`} style={{ width: `${targetProgress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[var(--ink-soft)]"><span>0:00</span><span>{elapsed > config.targetSeconds ? `${formatDuration(elapsed-config.targetSeconds)} over target` : `${formatDuration(config.targetSeconds-elapsed)} remaining`}</span></div></div><div className="mt-8 flex h-20 items-center justify-center gap-1" aria-label="Live microphone activity">{Array.from({ length: 36 }, (_, index) => <span key={index} className="w-1 rounded-full bg-[var(--accent)] transition-[height]" style={{ height: `${Math.max(8, Math.min(74, audioLevel*90 + Math.sin(index*1.7)*18))}px`, opacity: 0.35 + (index%7)/12 }} />)}</div><div className="mt-auto grid gap-3 pt-8"><Button variant="accent" size="lg" className="w-full" onClick={finishRecording}><Square className="size-4 fill-current" /> Finish session</Button><Button variant="ghost" className="w-full" onClick={restart}><X className="size-4" /> Discard and restart</Button></div></>}

              {(phase === "captured" || phase === "uploading" || phase === "error") && <div className="flex flex-1 flex-col justify-center text-center"><span className={`mx-auto grid size-14 place-items-center rounded-full ${phase === "error" ? "bg-[var(--danger-icon-soft)] text-[var(--danger)]" : "bg-[var(--success-soft)] text-[var(--success)]"}`}>{phase === "uploading" ? <LoaderCircle className="size-6 animate-spin" /> : phase === "error" ? <AlertTriangle className="size-6" /> : <Check className="size-6" />}</span><h1 className="mt-5 text-3xl font-[750] tracking-[-0.05em]">{phase === "uploading" ? "Saving your practice…" : phase === "error" ? "Your recording is still safe here." : "Recording complete."}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--ink-soft)]">{phase === "uploading" ? "Pulse is securing the media before transcription begins. Keep this tab open." : phase === "error" ? uploadError : `${formatDuration(elapsed)} captured${videoBlob ? " with video" : " as audio only"}. Nothing has been sent until you continue.`}</p>{phase === "captured" && <div className="mt-7 grid gap-3"><Button variant="accent" size="lg" onClick={upload}>Save and analyze <Clock3 className="size-4" /></Button><Button variant="ghost" onClick={restart}>Discard and record again</Button></div>}{phase === "error" && <div className="mt-7 grid gap-3"><Button variant="accent" size="lg" onClick={upload}><RefreshCcw className="size-4" /> Retry save</Button><ButtonLink href="/sessions/sample-community-change" variant="secondary">View labeled sample analysis</ButtonLink><Button variant="ghost" onClick={restart}>Discard recording</Button></div>}</div>}
            </section>
          </div>
        </div>
        <p className="sr-only" aria-live="assertive">{phase === "recording" ? "Recording started" : phase === "captured" ? "Recording stopped and held locally" : phase === "uploading" ? "Saving recording" : ""}</p>
      </div>
    </main>
  );
}
