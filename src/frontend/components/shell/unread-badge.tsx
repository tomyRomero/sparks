import { cn } from "@/lib/utils";

/** A count on a nav icon; hidden at zero, capped at 99+. */
export function UnreadBadge({ count, className }: { count: number | undefined; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-semibold text-brand-ink",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
