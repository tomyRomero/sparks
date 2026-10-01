"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/** A page of any list: by id (most lists) or with an opaque cursor (activity, the inbox). */
type Page<T, Cursor> = { items: T[]; nextCursor: Cursor | null };

/** Continues a server-rendered first page in the browser. */
export function usePagedList<T, Cursor extends number | string = number>(
  path: string,
  queryKey: readonly unknown[],
  initial: Page<T, Cursor>,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      if (pageParam === null) return api<Page<T, Cursor>>(path);
      const cursor = encodeURIComponent(String(pageParam));
      return api<Page<T, Cursor>>(`${path}${path.includes("?") ? "&" : "?"}cursor=${cursor}`);
    },
    initialPageParam: null as Cursor | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initial], pageParams: [null] },
  });
  return { query, items: query.data.pages.flatMap((page) => page.items) };
}
