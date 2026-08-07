import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[var(--navy)] text-white shadow-sm hover:bg-[var(--navy-hover)]",
  accent: "bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-dark)]",
  secondary: "border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:border-[var(--navy)] hover:bg-[var(--surface-muted)]",
  ghost: "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
  danger: "border border-[var(--danger-line)] bg-white text-[var(--danger)] hover:bg-[var(--danger-soft)]",
} as const;

const sizes = {
  sm: "min-h-10 px-3.5 text-sm",
  md: "min-h-11 px-4.5 text-sm",
  lg: "min-h-12 px-5.5 text-[0.95rem]",
  icon: "size-11 p-0",
} as const;

type StyleProps = { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };

export function buttonStyles({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-[680] tracking-[-0.01em] transition-colors disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
