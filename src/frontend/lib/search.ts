import type { SparkKind } from "@/lib/api/types";
import { appendKinds, type ParamSource, paramValues, readKinds } from "@/lib/feed";
import { limits } from "@/lib/limits";

export type SearchTab = "sparks" | "members";

export type SearchState = {
  /** Trimmed and capped like the API's; empty before anything is searched. */
  q: string;
  tab: SearchTab;
  /** Sparks only: any of these kinds, every kind when empty. */
  kinds: SparkKind[];
};

export function readSearch(params: ParamSource): SearchState {
  return {
    q: toTerm(paramValues(params, "q")[0] ?? ""),
    tab: paramValues(params, "type")[0] === "members" ? "members" : "sparks",
    kinds: readKinds(params),
  };
}

export function toTerm(text: string): string {
  return text.trim().slice(0, limits.searchMax);
}

/** The page URL: "/search?q=tide&kind=haiku", or "/search?q=nova&type=members". */
export function searchHref({ q, tab, kinds }: SearchState): string {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (tab === "members") search.set("type", "members");
  else appendKinds(search, kinds);
  const query = search.toString();
  return query ? `/search?${query}` : "/search";
}

export function sparkSearchPath(q: string, kinds: readonly SparkKind[]): string {
  const search = new URLSearchParams({ q });
  appendKinds(search, kinds);
  return `/posts?${search}`;
}

export function memberSearchPath(q: string): string {
  return `/users?${new URLSearchParams({ q })}`;
}

export function sameSearch(a: SearchState, b: SearchState): boolean {
  return searchHref(a) === searchHref(b);
}
