"use client";

import { useEffect, useRef } from "react";
import { errorMessage } from "@/lib/api/problem";
import { Button } from "./button";
import { Spinner } from "./spinner";

type ListFooterProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** The last page failed to load; `error` says why. */
  failed: boolean;
  error: unknown;
  fetchNextPage: () => unknown;
  /** What's loading, for screen readers: "Loading more sparks". */
  loadingLabel: string;
};

/** Loads the next page near the end, with a button fallback and a retry. */
export function ListFooter({
  hasNextPage,
  isFetchingNextPage,
  failed,
  error,
  fetchNextPage,
  loadingLabel,
}: ListFooterProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage || failed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, failed, fetchNextPage]);

  return (
    <div ref={sentinel} className="flex justify-center px-6 py-8">
      {failed ? (
        <div className="grid justify-items-center gap-3 text-sm text-muted">
          <p>{errorMessage(error)}</p>
          <Button variant="secondary" size="sm" onClick={() => void fetchNextPage()}>
            Try again
          </Button>
        </div>
      ) : isFetchingNextPage ? (
        <Spinner label={loadingLabel} />
      ) : hasNextPage ? (
        <Button variant="secondary" size="sm" onClick={() => void fetchNextPage()}>
          Load more
        </Button>
      ) : (
        <p className="label-mono">You&apos;re all caught up</p>
      )}
    </div>
  );
}
