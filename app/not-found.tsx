import { SearchX } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() { return <main className="grid min-h-screen place-items-center px-5"><div className="max-w-md text-center"><div className="flex justify-center"><Logo /></div><SearchX className="mx-auto mt-12 size-10 text-[var(--accent)]" /><h1 className="mt-5 text-4xl font-[750] tracking-[-0.06em]">That session isn’t here.</h1><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">It may have been deleted, expired, or belong to a different account. Pulse does not reveal private session details.</p><ButtonLink href="/dashboard" variant="accent" className="mt-7">Return to today</ButtonLink></div></main>; }
