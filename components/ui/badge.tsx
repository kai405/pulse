import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[var(--surface-muted)] text-[var(--ink-soft)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent-dark)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  dark: "bg-[var(--navy)] text-white",
} as const;

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 text-[0.68rem] font-[720] tracking-[0.03em]", tones[tone], className)}
      {...props}
    />
  );
}
