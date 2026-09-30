import type { SparkKind } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * A spark's text, set for its kind: haiku as a centred poem, quotes and
 * aphorisms large, scripts and plots with their title lifted out.
 */
export function PostBody({ kind, body, compact = false }: { kind: SparkKind; body: string; compact?: boolean }) {
  if (kind === "haiku") {
    return <p className="py-2 text-center font-display text-xl leading-relaxed whitespace-pre-line text-ink">{body}</p>;
  }

  if (kind === "quote" || kind === "aphorism") {
    return (
      <p
        className={cn(
          "font-display leading-snug font-medium tracking-tight text-ink",
          compact ? "text-lg" : "text-2xl",
          kind === "quote" && "before:content-['“'] after:content-['”']",
        )}
      >
        {body}
      </p>
    );
  }

  const titled = /^Title:\s*(.+)\n+([\s\S]*)$/.exec(body);
  if ((kind === "movieScript" || kind === "bookPlot") && titled) {
    return (
      <div>
        <p className="font-display text-xl leading-tight font-semibold tracking-tight">{titled[1].trim()}</p>
        <p className={cn("mt-2 leading-relaxed whitespace-pre-line text-ink-soft", compact && "line-clamp-4")}>
          {titled[2].trim()}
        </p>
      </div>
    );
  }

  return <p className={cn("leading-relaxed whitespace-pre-line", compact && "line-clamp-6")}>{body}</p>;
}
