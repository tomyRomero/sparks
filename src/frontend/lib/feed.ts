import type { SparkKind } from "@/lib/api/types";
import { isKind, kinds } from "@/lib/kinds";

export type FeedSort = "newest" | "top";

export type FeedFilter = {
  /** Any of these kinds, in the kinds list's order; every kind when empty. */
  kinds: SparkKind[];
  /** Newest first, or the most liked of the last week. */
  sort: FeedSort;
  /** Only sparks with a picture. */
  pictures: boolean;
};

export const unfiltered: FeedFilter = { kinds: [], sort: "newest", pictures: false };

/** A page's search params, from the server (a record) or the browser. */
export type ParamSource = Record<string, string | string[] | undefined> | URLSearchParams;

export function paramValues(params: ParamSource, name: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(name);
  return [params[name] ?? []].flat();
}

/** Known kinds from the URL, once each, in the kinds list's order. */
export function readKinds(params: ParamSource): SparkKind[] {
  const wanted = new Set(paramValues(params, "kind").filter(isKind));
  return kinds.map((info) => info.kind).filter((kind) => wanted.has(kind));
}

/** The feed's filter from the page URL; anything it doesn't know is dropped. */
export function readFeedFilter(params: ParamSource): FeedFilter {
  return {
    kinds: readKinds(params),
    sort: paramValues(params, "sort")[0] === "top" ? "top" : "newest",
    pictures: paramValues(params, "pictures")[0] === "1",
  };
}

/** The page URL for a filter: "/", or "/?kind=haiku&kind=joke&sort=top". */
export function feedHref(filter: FeedFilter): string {
  const search = new URLSearchParams();
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
