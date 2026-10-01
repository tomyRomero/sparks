import { cn } from "@/lib/utils";

/** A shimmering block standing in for content that's on its way. Sized by the caller. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-shimmer rounded-md skeleton-fill", className)} />;
}

/**
 * A whole page's stand-in while its data loads: the page's own skeleton, a
 * bar running along the top of the window, and a status for screen readers.
 * Each route's loading.tsx renders one, so a click shows the next page's
 * shape straight away instead of freezing on the old one.
 */
export function PageSkeleton({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" className={className}>
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
        <div className="h-full w-1/3 animate-progress bg-brand shadow-[0_0_8px_var(--charge-bright)]" />
      </div>
      <p role="status" className="sr-only">
        {label}
      </p>
      {children}
    </div>
  );
}
