"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api/client";

/** A page of any list: by id (most lists) or with an opaque cursor (activity, the inbox, top sparks). */
type Page<T, Cursor> = { items: T[]; nextCursor: Cursor | null };

/**
 * A paged list in the browser, continuing a server-rendered first page when
 * there is one. When the key changes (a new filter or search), the old list
 * stays on screen, marked as placeholder data, until the new one arrives.
 */
export function usePagedList<T, Cursor extends number | string = number>(
  path: string,
  queryKey: readonly unknown[],
  initial: Page<T, Cursor> | undefined,
) {
  // Server data is as old as the page; once it's stale, a revisit refetches it.
  const [renderedAt] = useState(() => Date.now());
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      if (pageParam === null) return api<Page<T, Cursor>>(path);
      const cursor = encodeURIComponent(String(pageParam));
      return api<Page<T, Cursor>>(`${path}${path.includes("?") ? "&" : "?"}cursor=${cursor}`);
    },
    initialPageParam: null as Cursor | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: initial && { pages: [initial], pageParams: [null] },
    initialDataUpdatedAt: renderedAt,
    placeholderData: keepPreviousData,
  });
  return { query, items: query.data?.pages.flatMap((page) => page.items) ?? [] };
}

/** What a list needs from its query to page and to show that it's loading. */
export type ListPaging = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  error: unknown;
  fetchNextPage: () => unknown;
};
