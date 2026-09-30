"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { CursorPage, Post } from "@/lib/api/types";
import { PostCard } from "./post-card";

type FeedProps = {
  /** The first page, rendered on the server. */
  initial: CursorPage<Post>;
  /** The API path of the list, with any filters: "/posts?kind=haiku". */
  path: string;
  queryKey: readonly unknown[];
  signedIn: boolean;
  empty: React.ReactNode;
};

/**
 * A list of sparks that loads the next page as the reader nears the end,
 * with a button for anyone who can't or won't scroll.
 */
export function Feed({ initial, path, queryKey, signedIn, empty }: FeedProps) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api<CursorPage<Post>>(pageParam ? `${path}${path.includes("?") ? "&" : "?"}cursor=${pageParam}` : path),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initial], pageParams: [null] },
  });

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = query.data.pages.flatMap((page) => page.items);
  const firstPicture = posts.find((post) => post.imageUrl)?.id;
  if (posts.length === 0) {
    return <div className="px-6 py-16 text-center">{empty}</div>;
  }

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} signedIn={signedIn} eagerImage={post.id === firstPicture} />
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="flex justify-center px-6 py-8">
        {query.isFetchNextPageError ? (
          <div className="grid justify-items-center gap-3 text-sm text-muted">
            <p>{errorMessage(query.error)}</p>
            <Button variant="secondary" size="sm" onClick={() => void fetchNextPage()}>
              Try again
            </Button>
          </div>
        ) : isFetchingNextPage ? (
          <Spinner label="Loading more sparks" />
        ) : hasNextPage ? (
          <Button variant="secondary" size="sm" onClick={() => void fetchNextPage()}>
            Load more
          </Button>
        ) : (
          <p className="label-mono">You&apos;re all caught up</p>
        )}
      </div>
    </div>
  );
}
