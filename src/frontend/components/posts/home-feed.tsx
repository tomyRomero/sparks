"use client";

import { Clock, Flame, ImageIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WhoToFollow } from "@/components/profile/who-to-follow";
import { Button } from "@/components/ui/button";
import { chipStyle } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import type { CursorPage, OpaquePage, Post } from "@/lib/api/types";
import { type FeedFilter, type FeedSort, feedHref, feedPath, readFeedFilter, sameFilter, unfiltered } from "@/lib/feed";
import { queryKeys } from "@/lib/queries/keys";
import { usePagedList, useShownFor } from "@/lib/queries/use-paged-list";
import { cn } from "@/lib/utils";
import { PostList } from "./feed";
import { KindMenu } from "./kind-menu";
import { FeedSkeleton } from "./post-skeletons";

const sorts = [
  { value: "newest", label: "Newest", icon: Clock },
  { value: "top", label: "Top this week", short: "Top", icon: Flame },
] as const;

type HomeFeedProps = {
  /** The filter the server rendered `initial` for. */
  initialFilter: FeedFilter;
  initial: CursorPage<Post> | OpaquePage<Post>;
  signedIn: boolean;
};

/**
 * The home feed and its filters. A change swaps the list in place, keeping
 * the old one faded until the new one arrives, and rewrites the URL without
 * a navigation so a reload or a shared link shows the same thing.
 */
export function HomeFeed({ initialFilter, initial, signedIn }: HomeFeedProps) {
  // From the URL, which every filter control rewrites (FeedScope too), rather
  // than the props: going Back can land on a URL this page rewrote, with the
  // props of the one it started from.
  const filter = readFeedFilter(useSearchParams(), signedIn);
  const { query, items } = usePagedList<Post, number | string>(
    feedPath(filter),
    queryKeys.feed(filter),
    sameFilter(filter, initialFilter) ? initial : undefined,
  );

  const anchor = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const stuck = useStuck(anchor, bar);

  // Deep in the list, start a new one from its top, just under the bar.
  const href = feedHref(filter);
  const shown = useRef(href);
  useLayoutEffect(() => {
    if (shown.current === href) return;
    shown.current = href;
    const top = anchor.current?.getBoundingClientRect().top;
    const barTop = bar.current ? parseFloat(getComputedStyle(bar.current).top) : 0;
    if (top !== undefined && top < barTop) window.scrollBy({ top: top - barTop });
  }, [href]);

  function change(next: Partial<FeedFilter>) {
    window.history.replaceState(null, "", feedHref({ ...filter, ...next }));
  }

  const loading = query.isPending || query.isPlaceholderData;
  const listed = useShownFor(filter, href, loading);
  const filtered = listed.kinds.length > 0 || listed.pictures;
  return (
    <>
      <div ref={anchor} aria-hidden />
      <div
        ref={bar}
        role="group"
        aria-label="Filter the feed"
        className={cn(
          "sticky top-14 z-10 -mx-3 mb-4 flex items-center gap-2 bg-canvas/85 px-3 py-2 backdrop-blur-md transition-shadow sm:-mx-4 sm:px-4 md:top-[72px] md:mx-0 md:px-1",
          stuck && "shadow-[0_1px_0_var(--line)]",
        )}
      >
        <KindMenu selected={filter.kinds} onChange={(kinds) => change({ kinds })} />
        <button
          type="button"
          aria-pressed={filter.pictures}
          aria-label="With pictures"
          onClick={() => change({ pictures: !filter.pictures })}
          className={chipStyle(filter.pictures, "max-sm:px-2.5")}
        >
          <ImageIcon aria-hidden />
          <span className="max-sm:hidden">With pictures</span>
        </button>
        <Segmented
          label="Sort"
          value={filter.sort}
          options={sorts}
          onChange={(sort: FeedSort) => change({ sort })}
          className="ms-auto"
        />
        {loading && (
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            <span className="block h-full w-1/3 animate-progress bg-brand" />
          </span>
        )}
      </div>
      {query.isPending ? (
        <FeedSkeleton />
      ) : (
        <PostList
          posts={items}
          paging={query}
          signedIn={signedIn}
          stale={loading}
          empty={
            <>
              <p className="font-display text-lg font-semibold">
                {filtered
                  ? "No sparks match these filters"
                  : listed.following
                    ? listed.sort === "top"
                      ? "Nothing from the people you follow was liked this week"
                      : "Nothing from the people you follow yet"
                    : listed.sort === "top"
                      ? "Nothing's been liked this week"
                      : "No sparks yet"}
              </p>
              {filtered ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => change({ kinds: unfiltered.kinds, pictures: unfiltered.pictures })}
                >
                  Clear filters
                </Button>
              ) : listed.following ? (
                <>
                  <p className="mt-1 text-muted">Follow a few people and their sparks show up here.</p>
                  <WhoToFollow />
                </>
              ) : (
                <p className="mt-1 text-muted">
                  {listed.sort === "top" ? "Like a spark and it shows up here." : "Be the first to share one."}
                </p>
              )}
            </>
          }
        />
      )}
    </>
  );
}

/**
 * Whether the bar is pinned under the page header: once scrolled past its
 * place, the anchor just above it moves up while the bar stays put.
 */
function useStuck(anchor: React.RefObject<HTMLElement | null>, bar: React.RefObject<HTMLElement | null>) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      if (anchor.current && bar.current) {
        setStuck(anchor.current.getBoundingClientRect().top < bar.current.getBoundingClientRect().top - 1);
      }
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [anchor, bar]);
  return stuck;
}
