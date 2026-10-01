"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History, LoaderCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { PostList } from "@/components/posts/feed";
import { KindMenu } from "@/components/posts/kind-menu";
import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { MemberList } from "@/components/profile/member-list";
import { MemberListSkeleton } from "@/components/profile/profile-skeletons";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/client";
import type { CursorPage, Post, SearchCounts, SparkKind, UserSummary } from "@/lib/api/types";
import { kinds } from "@/lib/kinds";
import { limits } from "@/lib/limits";
import { queryKeys } from "@/lib/queries/keys";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { forgetAllSearches, forgetSearch, rememberSearch, useRecentSearches } from "@/lib/recent-searches";
import {
  memberSearchPath,
  readSearch,
  type SearchState,
  type SearchTab,
  sameSearch,
  searchHref,
  sparkSearchPath,
  toTerm,
} from "@/lib/search";
import { SEARCH_BOX_ID, takeSearchFocus } from "@/lib/search-focus";
import { cn } from "@/lib/utils";
import { HighlightProvider } from "./highlight";

/** How long typing pauses before it searches. */
const SETTLE_MS = 250;

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

type SearchViewProps = {
  /** What the server rendered the results below for. */
  initialSearch: SearchState;
  sparks: CursorPage<Post> | undefined;
  members: CursorPage<UserSummary> | undefined;
  counts: SearchCounts | undefined;
  signedIn: boolean;
};

/**
 * Search that answers as you type. The URL follows without a navigation, so
 * a reload or a shared link shows the same results; before scripts load the
 * box is a plain GET form.
 */
export function SearchView({ initialSearch, sparks, members, counts: initialCounts, signedIn }: SearchViewProps) {
  const params = useSearchParams();
  // From the URL rather than the props: going Back can land on a URL this
  // page rewrote, with the props of the one it started from.
  const [search, setSearch] = useState(() => readSearch(params));
  const [text, setText] = useState(search.q);
  const box = useRef<HTMLInputElement>(null);
  const fromServer = sameSearch(search, initialSearch);

  function update(patch: Partial<SearchState>) {
    const next = { ...search, ...patch };
    setSearch(next);
    window.history.replaceState(null, "", searchHref(next));
    document.title = next.q ? `“${next.q}” · Sparks` : "Search · Sparks";
  }

  const settle = useEffectEvent(() => {
    const q = toTerm(text);
    if (q !== search.q) update({ q });
  });
  useEffect(() => {
    const timer = window.setTimeout(settle, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [text]);

  // Sent here by the "/" shortcut, or opened on a computer with nothing typed yet.
  useEffect(() => {
    const input = box.current;
    if (input && (takeSearchFocus() || (!input.value && window.matchMedia("(pointer: fine)").matches))) {
      input.focus();
    }
  }, []);

  const counts = useQuery({
    queryKey: queryKeys.searchCounts(search.q),
    queryFn: () => api<SearchCounts>(`/search/counts?${new URLSearchParams({ q: search.q })}`),
    enabled: search.q !== "",
    initialData: search.q === initialSearch.q ? initialCounts : undefined,
    placeholderData: keepPreviousData,
  });

  function searchNow(term: string) {
    const q = toTerm(term);
    setText(q);
    update({ q });
    rememberSearch(q);
  }

  const waiting = toTerm(text) !== search.q || (search.q !== "" && counts.isPlaceholderData);
  return (
    <>
      <form
        action="/search"
        role="search"
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          searchNow(text);
          // On a phone, put the keyboard away to show the results.
          if (window.matchMedia("(pointer: coarse)").matches) box.current?.blur();
        }}
      >
        <div className="relative">
          {waiting ? (
            <LoaderCircle
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 animate-spin text-brand"
              aria-hidden
            />
          ) : (
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          )}
          <input
            ref={box}
            id={SEARCH_BOX_ID}
            type="search"
            name="q"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && text) {
                event.preventDefault();
                searchNow("");
              }
            }}
            maxLength={limits.searchMax}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Search sparks and members"
            aria-label="Search sparks and members"
            className="peer h-12 w-full rounded-[14px] border border-line bg-surface pr-12 pl-11 text-[15px] text-ink shadow-card placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {text ? (
            <button
              type="button"
              aria-label="Clear the search"
              onClick={() => {
                searchNow("");
                box.current?.focus();
              }}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3.5 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-raised px-1.5 font-mono text-xs text-muted peer-focus:hidden max-md:hidden"
            >
              /
            </kbd>
          )}
        </div>
        {/* What the tab and kinds would add, for a search sent before scripts load. */}
        {search.tab === "members" ? (
          <input type="hidden" name="type" value="members" />
        ) : (
          search.kinds.map((kind) => <input key={kind} type="hidden" name="kind" value={kind} />)
        )}
      </form>

      {search.q ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <SearchTabs search={search} counts={counts.data} onChange={(tab) => update({ tab })} />
            {search.tab === "sparks" && <KindMenu selected={search.kinds} onChange={(kinds) => update({ kinds })} />}
          </div>
          <HighlightProvider term={search.q}>
            {/* Opening a result keeps the search for next time. */}
            <div
              onClickCapture={(event) => {
                if (event.target instanceof Element && event.target.closest("a")) rememberSearch(search.q);
              }}
            >
              {search.tab === "sparks" ? (
                <SparkResults
                  q={search.q}
                  kinds={search.kinds}
                  initial={fromServer ? sparks : undefined}
                  signedIn={signedIn}
                />
              ) : (
                <MemberResults q={search.q} initial={fromServer ? members : undefined} />
              )}
            </div>
          </HighlightProvider>
        </>
      ) : (
        <SearchStart onSearch={searchNow} />
      )}
    </>
  );
}

type SearchTabsProps = {
  search: SearchState;
  counts: SearchCounts | undefined;
  onChange: (tab: SearchTab) => void;
};

/** Real links, so a new tab or a copied link works; a plain click switches in place. */
function SearchTabs({ search, counts, onChange }: SearchTabsProps) {
  const tabs = [
    { value: "sparks", label: "Sparks", count: counts?.sparks },
    { value: "members", label: "Members", count: counts?.members },
  ] as const;
  return (
    <nav aria-label="Search results">
      <ul className="inline-flex rounded-xl bg-raised p-1">
        {tabs.map(({ value, label, count }) => {
          const current = value === search.tab;
          return (
            <li key={value}>
              <a
                href={searchHref({ ...search, tab: value })}
                aria-current={current ? "page" : undefined}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onChange(value);
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                  current && "bg-surface text-ink shadow-sm",
                )}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 py-px text-center font-mono text-[11px] tabular-nums",
                      current ? "bg-brand-soft text-brand" : "bg-line/70 text-muted",
                    )}
                  >
                    {compact.format(count)}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type SparkResultsProps = {
  q: string;
  kinds: SparkKind[];
  initial: CursorPage<Post> | undefined;
  signedIn: boolean;
};

function SparkResults({ q, kinds, initial, signedIn }: SparkResultsProps) {
  const { query, items } = usePagedList(sparkSearchPath(q, kinds), queryKeys.feed({ q, kinds }), initial);
  if (query.isPending) return <FeedSkeleton count={3} />;
  return (
    <PostList
      posts={items}
      paging={query}
      signedIn={signedIn}
      stale={query.isPlaceholderData}
      empty={<NoResults q={q} what={kinds.length ? "sparks of those kinds" : "sparks"} />}
    />
  );
}

function MemberResults({ q, initial }: { q: string; initial: CursorPage<UserSummary> | undefined }) {
  const { query, items } = usePagedList(memberSearchPath(q), queryKeys.members(q), initial);
  return (
    <Panel>
      {query.isPending ? (
        <MemberListSkeleton />
      ) : (
        <MemberList
          members={items}
          paging={query}
          stale={query.isPlaceholderData}
          empty={<NoResults q={q} what="members" />}
        />
      )}
    </Panel>
  );
}

function NoResults({ q, what }: { q: string; what: string }) {
  return (
    <>
      <p className="font-display text-lg font-semibold">
        No {what} match “{q}”
      </p>
      <p className="mt-1 text-muted">Try a shorter word, or a name.</p>
    </>
  );
}

/** Before anything is typed: this browser's recent searches, and the kinds to browse. */
function SearchStart({ onSearch }: { onSearch: (term: string) => void }) {
  const recent = useRecentSearches();
  return (
    <div className="grid gap-4">
      {recent.length > 0 && (
        <section
          aria-labelledby="recent-searches"
          className="rounded-[18px] border border-line bg-surface p-2 shadow-card"
        >
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <h2 id="recent-searches" className="label-mono">
              Recent searches
            </h2>
            <button
              type="button"
              onClick={forgetAllSearches}
              className="rounded-md px-1.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              Clear all
            </button>
          </div>
          <ul>
            {recent.map((term) => (
              <li key={term} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSearch(term)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-raised"
                >
                  <History className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove “${term}” from recent searches`}
                  onClick={() => forgetSearch(term)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-[18px] border border-line bg-surface p-5 shadow-card sm:p-6">
        <p className="text-muted">Find sparks by their words or their author, and members by name.</p>
        <h2 className="mt-6 label-mono">Or browse a kind</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {kinds.map(({ kind, label, icon: Icon }) => (
            <li key={kind}>
              <Link
                href={`/?kind=${kind}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
