import { cn } from "@/lib/utils";

/** For lists of rows; the last row's divider tucks under the card's border. */
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
