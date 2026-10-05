import { cn } from "@/lib/utils";
import { PageTop } from "./page-top";
import { ScrollToTop } from "./scroll-to-top";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-shimmer rounded-md skeleton-fill", className)} />;
}

/**
 * A route's loading.tsx: the page's skeleton, a top progress bar and a screen
 * reader status. A new page's skeleton starts at the top: Next.js scrolls up
 * for some loading screens but not others (a spark's, a profile's), which
 * would leave one scrolled down to wherever the last page was until the page
 * itself arrived. A tab's skeleton within a page keeps the reader's place.
 */
export function PageSkeleton({
  label,
  inPlace = false,
  className,
  children,
}: {
  label: string;
  /** A tab's skeleton, below the page's own header: the page doesn't scroll. */
  inPlace?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {inPlace ? <PageTop /> : <ScrollToTop />}
      <div aria-busy="true" className={className}>
        <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-progress bg-brand shadow-[0_0_8px_var(--charge-bright)]" />
        </div>
        <p role="status" className="sr-only">
          {label}
        </p>
        {children}
      </div>
    </>
  );
}
