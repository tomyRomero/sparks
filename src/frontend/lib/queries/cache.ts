import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Comment, Post } from "@/lib/api/types";
import { queryKeys } from "./keys";

/** One page of a list, by id or with an opaque cursor. */
type Page<T> = { items: T[]; nextCursor: unknown };

/**
 * What a cache entry under "posts" or "comments" holds: a paged list, a single
 * page (a short list like Trending), or one item on its own page.
 */
type Cached<T> = InfiniteData<Page<T>> | Page<T> | T;

function isPages<T>(data: Cached<T>): data is InfiniteData<Page<T>> {
  return typeof data === "object" && data !== null && "pages" in data;
}

function isPage<T>(data: Cached<T>): data is Page<T> {
  return typeof data === "object" && data !== null && "items" in data;
}

function updateCached<T extends { id: number }>(data: Cached<T> | undefined, id: number, update: (item: T) => T) {
  if (data === undefined) return data;
  const updatePage = (page: Page<T>) => ({
    ...page,
    items: page.items.map((item) => (item.id === id ? update(item) : item)),
  });
  if (isPages(data)) return { ...data, pages: data.pages.map(updatePage) };
  if (isPage(data)) return updatePage(data);
  return data.id === id ? update(data) : data;
}

export function updateCachedPost(queryClient: QueryClient, id: number, update: (post: Post) => Post) {
  queryClient.setQueriesData<Cached<Post>>({ queryKey: queryKeys.posts }, (data) => updateCached(data, id, update));
}

export function updateCachedComment(queryClient: QueryClient, id: number, update: (comment: Comment) => Comment) {
  queryClient.setQueriesData<Cached<Comment>>({ queryKey: queryKeys.comments }, (data) =>
    updateCached(data, id, update),
  );
}

/** Drops inactive spark lists after a change they can't patch (a new or deleted spark). */
export function forgetPostLists(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.posts, type: "inactive" });
}
