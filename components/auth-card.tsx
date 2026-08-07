"use client";

import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AuthCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "guest" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const response = await fetch("/api/auth/magic-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) { setStatus("error"); setMessage(data.error ?? "Sign-in failed."); return; }
    setStatus("sent");
  }

  async function continueAsGuest() {
    setStatus("guest");
    const response = await fetch("/api/auth/guest", { method: "POST" });
    const data = (await response.json()) as { next?: string; error?: string };
    if (!response.ok) { setStatus("error"); setMessage(data.error ?? "Guest access failed."); return; }
    router.push(data.next ?? "/onboarding");
  }

  return (
    <div className="surface w-full max-w-md p-6 shadow-[var(--shadow-lg)] sm:p-8">
      {status === "sent" ? (
        <div className="py-4 text-center" aria-live="polite">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><Check className="size-5" /></span>
          <h1 className="mt-5 text-2xl font-[740] tracking-[-0.045em]">Check your inbox</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">We sent a private sign-in link to <strong className="text-[var(--ink)]">{email}</strong>. It may take a minute to arrive.</p>
          <Button variant="ghost" className="mt-5" onClick={() => setStatus("idle")}>Use a different email</Button>
        </div>
      ) : (
        <>
          <p className="eyebrow">Start practicing</p>
          <h1 className="mt-4 text-3xl font-[750] tracking-[-0.055em]">A quieter way to improve.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Sign in to keep progress across devices, or begin with a private seven-day guest workspace.</p>
          <form onSubmit={sendMagicLink} className="mt-7">
            <label htmlFor="email" className="text-sm font-[680]">Email address</label>
            <div className="relative mt-2"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" /><input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)]" /></div>
            {status === "error" && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{message}</p>}
            <Button type="submit" variant="accent" size="lg" className="mt-4 w-full" disabled={status === "sending"}>{status === "sending" ? <LoaderCircle className="size-4 animate-spin" /> : <>Email me a sign-in link <ArrowRight className="size-4" /></>}</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-[var(--ink-soft)]"><span className="h-px flex-1 bg-[var(--line)]" />or<span className="h-px flex-1 bg-[var(--line)]" /></div>
          <Button variant="secondary" size="lg" className="w-full" onClick={continueAsGuest} disabled={status === "guest"}>{status === "guest" ? <LoaderCircle className="size-4 animate-spin" /> : "Continue as guest"}</Button>
          <p className="mt-5 text-center text-[0.7rem] leading-5 text-[var(--ink-soft)]">Guest sessions expire after seven days unless you convert the workspace. By continuing, you acknowledge the <a className="underline underline-offset-2" href="/privacy">privacy summary</a>.</p>
        </>
      )}
    </div>
  );
}
