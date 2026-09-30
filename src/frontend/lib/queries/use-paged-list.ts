"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CursorPage } from "@/lib/api/types";

/**
 * A list the server rendered the first page of, continued in the browser a
 * page at a time. `path` is the API path with any filters: "/posts?kind=haiku".
 */
export function usePagedList<T>(path: string, queryKey: readonly unknown[], initial: CursorPage<T>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      api<CursorPage<T>>(pageParam ? `${path}${path.includes("?") ? "&" : "?"}cursor=${pageParam}` : path),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initial], pageParams: [null] },
  });
  return { query, items: query.data.pages.flatMap((page) => page.items) };
}
