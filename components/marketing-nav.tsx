import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Logo />
      <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-[620] text-[var(--ink-soft)] md:flex">
        <a href="#how-it-works" className="rounded-md hover:text-[var(--ink)]">How it works</a>
        <a href="#feedback" className="rounded-md hover:text-[var(--ink)]">What you’ll learn</a>
        <a href="#privacy" className="rounded-md hover:text-[var(--ink)]">Privacy</a>
      </nav>
      <ButtonLink href="/auth" size="sm">
        Start practicing <ArrowUpRight className="size-4" aria-hidden="true" />
      </ButtonLink>
    </header>
  );
}
