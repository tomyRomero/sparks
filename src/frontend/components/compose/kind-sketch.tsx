import type { SparkKind } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// Bars for text and blocks for pictures; the tile around it tints them when picked.
const text = "h-[3px] rounded-full bg-line-strong group-has-checked:bg-brand/45";
const picture = "rounded-[3px] bg-line group-has-checked:bg-brand/25";

/** A thumbnail of how a kind's card is laid out, for the kind picker. */
export function KindSketch({ kind, className }: { kind: SparkKind; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative flex h-11 w-16 flex-col justify-center gap-1 overflow-hidden", className)}
    >
      {sketches[kind]}
    </span>
  );
}

const lines = (...widths: string[]) => widths.map((width, index) => <span key={index} className={cn(text, width)} />);

const sketches: Record<SparkKind, React.ReactNode> = {
  regular: lines("w-full", "w-11/12", "w-3/4", "w-1/2"),
  movieScript: (
    <span className="flex h-full flex-col justify-end gap-1 rounded-[4px] bg-screen px-1.5 pb-1.5">
      <span className="h-[3px] w-3/4 rounded-full bg-screen-ink/80" />
      <span className="h-[2px] w-full rounded-full bg-screen-muted/60" />
      <span className="h-[2px] w-2/3 rounded-full bg-screen-muted/60" />
    </span>
  ),
  bookPlot: (
    <span className="flex h-full items-center gap-1.5">
      <span className={cn(picture, "h-full w-6 shrink-0 rounded-[2px_4px_4px_2px]")} />
      <span className="flex flex-1 flex-col gap-1">{lines("w-full", "w-full", "w-3/4", "w-1/2")}</span>
    </span>
  ),
  artwork: (
    <span className="flex h-full flex-col items-center gap-1">
      <span className={cn(picture, "w-6 flex-1 ring-2 ring-line-strong/60 ring-inset")} />
      <span className={cn(text, "w-8")} />
    </span>
  ),
  fashion: (
    <span className="flex h-full flex-col items-center gap-1">
      <span className={cn(picture, "aspect-square flex-1")} />
      <span className={cn(text, "w-10")} />
    </span>
  ),
  photography: (
    <span className="flex h-full flex-col gap-1">
      <span className={cn(picture, "w-full flex-1")} />
      <span className={cn(text, "w-3/4")} />
    </span>
  ),
  haiku: (
    <span className="flex h-full flex-col justify-center gap-1.5 rounded-[4px] bg-raised px-2 group-has-checked:bg-brand-soft">
      <span className={cn(text, "w-3/5")} />
      <span className={cn(text, "ms-2 w-4/5")} />
      <span className={cn(text, "w-1/2")} />
    </span>
  ),
  quote: (
    <span className="flex h-full flex-col justify-center gap-1">
      <span className="h-3 font-display text-2xl leading-[0.9] font-extrabold text-brand/70">“</span>
      {lines("w-full", "w-2/3")}
    </span>
  ),
  joke: (
    <span className="flex h-full flex-col justify-center gap-1.5">
      {lines("w-full", "w-2/3")}
      <span className="h-3 w-full rounded-[3px] border border-dashed border-line-strong group-has-checked:border-brand/50" />
    </span>
  ),
  aphorism: (
    <span className="flex h-full flex-col justify-center gap-1.5">
      <span className={cn(text, "h-[5px] w-full")} />
      <span className={cn(text, "h-[5px] w-3/5")} />
    </span>
  ),
};
