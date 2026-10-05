import { cn } from "@/lib/utils";

type UnreadBadgeProps = {
  count: number | undefined;
  /** Adds " unread" for screen readers, where the badge is part of a link's name. */
  spoken?: boolean;
  className?: string;
};

export function UnreadBadge({ count, spoken = false, className }: UnreadBadgeProps) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 font-mono text-[10px] font-semibold text-brand-ink",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      {spoken && <span className="sr-only"> unread</span>}
    </span>
  );
}
