import { cn } from "@/lib/utils";

/**
 * A card for lists of rows (activity, comments, members). Rows keep their
 * dividing lines; the last one tucks under the card's own edge, so it
 * never shows twice.
 */
export function Panel({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("overflow-hidden rounded-[18px] border border-line bg-surface shadow-card", className)}
      {...props}
    >
      <div className="-mb-px">{children}</div>
    </div>
  );
}
