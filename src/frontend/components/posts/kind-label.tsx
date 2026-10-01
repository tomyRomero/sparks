import { Zap } from "lucide-react";
import type { SparkKind } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { cn } from "@/lib/utils";

const chip =
  "inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] whitespace-nowrap";

export function KindChip({ kind }: { kind: SparkKind }) {
  const { label, icon: Icon } = kindInfo(kind);
  return (
    <span className={cn(chip, "border border-line bg-surface text-muted max-sm:px-2")}>
      <Icon className="size-3.5" aria-hidden />
      <span className="max-sm:sr-only">{label}</span>
    </span>
  );
}

export function AiChip() {
  return (
    <span className={cn(chip, "bg-charge-soft text-charge")}>
      <Zap className="size-3 fill-current" aria-hidden />
      <span className="max-sm:hidden">AI draft</span>
      <span className="sm:hidden">AI</span>
    </span>
  );
}

export function AiPrompt({ prompt }: { prompt: string }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] bg-raised px-3 py-2 font-mono text-xs leading-relaxed text-muted">
      <Zap className="mt-0.5 size-3.5 shrink-0 fill-current text-charge" aria-hidden />
      <span>
        <span className="text-ink-soft">Prompt</span> {prompt}
      </span>
    </p>
  );
}
