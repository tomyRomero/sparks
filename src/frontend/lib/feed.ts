import type { SparkKind } from "@/lib/api/types";
import { isKind, kinds } from "@/lib/kinds";
import { type ParamSource, paramValues } from "@/lib/params";

export type FeedSort = "newest" | "top";

export type FeedFilter = {
  /** Any of these kinds, in the kinds list's order; every kind when empty. */
  kinds: SparkKind[];
  /** Newest first, or the most liked of the last week. */
  sort: FeedSort;
  /** Only sparks with a picture. */
  pictures: boolean;
  /** Only sparks from the people the viewer follows, and their own. Members only. */
  following: boolean;
};

export const unfiltered: FeedFilter = { kinds: [], sort: "newest", pictures: false, following: false };

/** Known kinds from the URL, once each, in the kinds list's order. */
export function readKinds(params: ParamSource): SparkKind[] {
  const wanted = new Set(paramValues(params, "kind").filter(isKind));
  return kinds.map((info) => info.kind).filter((kind) => wanted.has(kind));
}

/**
 * The feed's filter from the page URL; anything it doesn't know is dropped,
 * and so is Following for a guest, who follows no one.
 */
export function readFeedFilter(params: ParamSource, signedIn = true): FeedFilter {
  return {
    kinds: readKinds(params),
    sort: paramValues(params, "sort")[0] === "top" ? "top" : "newest",
    pictures: paramValues(params, "pictures")[0] === "1",
    following: signedIn && paramValues(params, "feed")[0] === "following",
  };
}

/** The page URL for a filter: "/", or "/?feed=following&kind=haiku&kind=joke&sort=top". */
export function feedHref(filter: FeedFilter): string {
  const search = new URLSearchParams();
  if (filter.following) search.set("feed", "following");
  appendKinds(search, filter.kinds);
  if (filter.sort === "top") search.set("sort", "top");
  if (filter.pictures) search.set("pictures", "1");
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

/** The API path of a filter's first page. Top looks back a week, the API's default. */
export function feedPath(filter: FeedFilter): string {
  const search = new URLSearchParams();
  appendKinds(search, filter.kinds);
  if (filter.pictures) search.set("pictures", "true");
  if (filter.following) search.set("following", "true");
  const base = filter.sort === "top" ? "/posts/top" : "/posts";
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function appendKinds(search: URLSearchParams, selected: readonly SparkKind[]) {
  for (const kind of selected) search.append("kind", kind);
}

/** Adds or removes a kind, keeping the kinds list's order. */
export function toggleKind(selected: readonly SparkKind[], kind: SparkKind): SparkKind[] {
  const next = new Set(selected);
  if (!next.delete(kind)) next.add(kind);
  return kinds.map((info) => info.kind).filter((each) => next.has(each));
}

export function sameFilter(a: FeedFilter, b: FeedFilter): boolean {
  return feedHref(a) === feedHref(b);
}
