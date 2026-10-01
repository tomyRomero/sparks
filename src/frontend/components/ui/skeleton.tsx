import { cn } from "@/lib/utils";
import { PageTop } from "./page-top";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-shimmer rounded-md skeleton-fill", className)} />;
}

/**
 * A route's loading.tsx: the page's skeleton, a top progress bar and a screen
 * reader status. Next.js may check a loading screen, not the page, to decide
 * whether to scroll to the top, so it starts with the same marker pages do.
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
    <>
      <PageTop />
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
