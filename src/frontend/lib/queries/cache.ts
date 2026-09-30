import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Comment, CursorPage, Post } from "@/lib/api/types";
import { queryKeys } from "./keys";

/** What a cache entry under "posts" or "comments" holds: a paged list, or one item on its own page. */
type Cached<T> = InfiniteData<CursorPage<T>> | T;

function isPages<T>(data: Cached<T>): data is InfiniteData<CursorPage<T>> {
  return typeof data === "object" && data !== null && "pages" in data;
}

function updateCached<T extends { id: number }>(data: Cached<T> | undefined, id: number, update: (item: T) => T) {
  if (data === undefined) return data;
  if (!isPages(data)) return data.id === id ? update(data) : data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === id ? update(item) : item)),
    })),
  };
}

/** Changes one spark everywhere the cache shows it: its page and every list. */
export function updateCachedPost(queryClient: QueryClient, id: number, update: (post: Post) => Post) {
  queryClient.setQueriesData<Cached<Post>>({ queryKey: queryKeys.posts }, (data) => updateCached(data, id, update));
}

/** Changes one comment everywhere the cache shows it: its page and every list. */
export function updateCachedComment(queryClient: QueryClient, id: number, update: (comment: Comment) => Comment) {
  queryClient.setQueriesData<Cached<Comment>>({ queryKey: queryKeys.comments }, (data) =>
    updateCached(data, id, update),
  );
}

/**
 * Drops the cached lists of sparks that aren't on screen, after a change a
 * list can't patch in place (a new spark, a deleted one). Each starts again
 * from the first page the server renders.
 */
export function forgetPostLists(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.posts, type: "inactive" });
}
