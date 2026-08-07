import Link from "next/link";
import { cn } from "@/lib/utils";

export function PulseMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative grid size-9 place-items-center rounded-[0.7rem] bg-[var(--navy)] text-white", className)}
    >
      <svg viewBox="0 0 32 20" className="h-4 w-6" fill="none">
        <path
          d="M1 11h5l2.7-7 4.2 14 4.1-12 2.6 5H31"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="Pulse home">
      <PulseMark />
      {!compact && <span className="text-lg font-[760] tracking-[-0.04em]">Pulse</span>}
    </Link>
  );
}
