import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** The bolt on a brand-blue tile: Sparks' mark, and the sign for AI help. */
export function BoltMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex size-9 items-center justify-center rounded-md bg-brand text-brand-ink", className)}
    >
      <Zap className="size-5 fill-current" aria-hidden />
    </span>
  );
}

/** The mark and the wordmark together. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BoltMark />
      <span className="font-wordmark text-2xl leading-none text-ink">Sparks</span>
    </span>
  );
}
