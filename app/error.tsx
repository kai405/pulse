"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="grid min-h-screen place-items-center px-5"><div className="surface max-w-md p-8 text-center"><AlertTriangle className="mx-auto size-9 text-[var(--danger)]" /><h1 className="mt-5 text-2xl font-[740] tracking-[-0.04em]">Pulse hit an unexpected problem.</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Your recording and session data are not deleted by this screen. Try loading the page again.</p><Button variant="accent" className="mt-6" onClick={reset}><RefreshCcw className="size-4" /> Try again</Button></div></main>; }
