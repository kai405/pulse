import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = "lg", label = "Overall score", className }: { score: number; size?: "sm" | "lg"; label?: string; className?: string }) {
  const dimensions = size === "lg" ? "size-36" : "size-20";
  const stroke = size === "lg" ? 8 : 7;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", dimensions, className)} role="img" aria-label={`${label}: ${score} out of 100`}>
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth={stroke} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn("font-[760] tracking-[-0.06em]", size === "lg" ? "text-4xl" : "text-xl")}>{score}</span>
    </div>
  );
}
