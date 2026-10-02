"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Heart, type LucideIcon, MessageCircle, UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { IntentLink } from "@/components/ui/intent-link";
import { ListFooter } from "@/components/ui/list-footer";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import {
  activityHref,
  activityPath,
  activityVerbs,
  byRecency,
  inSentence,
  namedActors,
  othersPhrase,
  readActivityFilter,
  recencyLabels,
  withoutTitleLabel,
} from "@/lib/activity";
import type { ActivityFilter, ActivityItem, ActivityKind, OpaquePage } from "@/lib/api/types";
import { markActivityRead } from "@/lib/queries/activity";
import { queryKeys } from "@/lib/queries/keys";
import { usePagedList, useShownFor } from "@/lib/queries/use-paged-list";
import { excerpt } from "@/lib/text";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ActivitySkeleton } from "./activity-skeleton";

/** Shorter than the start of the text the API sends, so a quote it cut ends at a word, with an ellipsis. */
const QUOTE_MAX = 120;

const like = { icon: Heart, tone: "bg-like/12 text-like [&_svg]:fill-current" };
const answer = { tone: "bg-brand-soft text-brand" };
const looks: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  postLike: like,
  commentLike: like,
  comment: { ...answer, icon: MessageCircle },
  reply: { ...answer, icon: CornerDownRight },
  follow: { icon: UserPlus, tone: "bg-success/12 text-success" },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "likes", label: "Likes", icon: Heart },
  { value: "comments", label: "Comments", icon: MessageCircle },
  { value: "replies", label: "Replies", icon: CornerDownRight },
  { value: "follows", label: "Follows", icon: UserPlus },
] as const;

const emptyTitles: Record<ActivityFilter | "all", string> = {
  all: "Nothing yet",
  likes: "No likes yet",
  comments: "No comments yet",
  replies: "No replies yet",
  follows: "No new followers yet",
};

type ActivityListProps = {
  /** The filter the server rendered `initial` for. */
  initialFilter: ActivityFilter | undefined;
  initial: OpaquePage<ActivityItem>;
  /** When the server rendered the page, so both sides put items in the same sections. */
  now: string;
  /** Where several new followers lead: the viewer's followers. */
  viewerUsername: string;
};

/**
 * Activity in sections by age, likes on one thing folded into one row.
 * Opening the page marks what it shows as read, but new items stay
 * highlighted for this visit.
 */
export function ActivityList({ initialFilter, initial, now, viewerUsername }: ActivityListProps) {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const [filter, setFilter] = useState(() => readActivityFilter(params));
  const { query, items } = usePagedList<ActivityItem, string>(
    activityPath(filter),
    queryKeys.activityList(filter),
    filter === initialFilter ? initial : undefined,
  );

  // Always start from the server's first page so the read state is current.
  useEffect(() => () => queryClient.removeQueries({ queryKey: queryKeys.activity }), [queryClient]);

  const newest = initial.items[0];
  useEffect(() => {
    if (newest?.unread) void markActivityRead(queryClient, newest.at).catch(() => {});
  }, [newest, queryClient]);

  function change(value: ActivityFilter | "all") {
    const next = value === "all" ? undefined : value;
    setFilter(next);
    window.history.replaceState(null, "", activityPath(next));
  }

  const stale = query.isPlaceholderData;
  const listed = useShownFor(filter, filter ?? "all", stale);
  return (
    <>
      <Segmented
        label="Show"
        value={filter ?? "all"}
        options={filterOptions}
        onChange={change}
        compactOnPhones
        className="mb-4"
      />
      <Panel>
        {query.isPending ? (
          <ActivitySkeleton />
        ) : items.length === 0 ? (
          <div className={cn("px-6 py-16 text-center transition-opacity", stale && "opacity-50")}>
            <p className="font-display text-lg font-semibold">{emptyTitles[listed ?? "all"]}</p>
            <p className="mt-1 text-muted">
              When someone likes or comments on your sparks, or follows you, it shows up here.
            </p>
          </div>
        ) : (
          <div
            aria-busy={stale}
            className={cn("transition-opacity duration-200", stale && "pointer-events-none opacity-50")}
          >
            {byRecency(items, Date.parse(now)).map(({ recency, items: inSection }) => (
              <section key={recency} aria-labelledby={`activity-${recency}`}>
                <h2
                  id={`activity-${recency}`}
                  className="border-b border-line bg-raised/50 px-4 py-2 label-mono font-medium text-ink-soft sm:px-6"
                >
                  {recencyLabels[recency]}
                </h2>
                <ul>
                  {inSection.map((item) => (
                    <li key={`${item.kind}:${item.commentId ?? item.postId ?? item.at}`}>
                      <ActivityRow item={item} viewerUsername={viewerUsername} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {!stale && (
              <ListFooter
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                failed={query.isFetchNextPageError}
                error={query.error}
                fetchNextPage={query.fetchNextPage}
                loadingLabel="Loading earlier activity"
              />
            )}
          </div>
        )}
      </Panel>
    </>
  );
}

function ActivityRow({ item, viewerUsername }: { item: ActivityItem; viewerUsername: string }) {
  const { icon: Icon, tone } = looks[item.kind];
  return (
    <IntentLink
      href={activityHref(item, viewerUsername)}
      className={cn(
        "relative flex gap-3.5 border-b border-line px-4 py-4 transition-colors hover:bg-raised/50 sm:px-6",
        item.unread && "bg-brand-soft/40 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone)}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex" aria-hidden>
          {item.actors.map((actor, index) => (
            <Avatar
              key={actor.id}
              name={actor.displayName}
              src={actor.avatarUrl}
              size={30}
              className={cn("ring-2 ring-surface", index > 0 && "-ml-2")}
            />
          ))}
        </span>
        <span className="mt-2 block leading-snug">
          {item.unread && <span className="sr-only">New: </span>}
          <Actors item={item} /> {activityVerbs[item.kind]}
          {/* Joined to the last word, so the time never wraps onto a line of its own. */}
          <span className="label-mono whitespace-nowrap">
            {"\u00a0· "}
            <time dateTime={item.at} title={fullDate(item.at)} suppressHydrationWarning>
              {timeAgo(item.at)}
            </time>
          </span>
        </span>
        {item.excerpt !== null && (
          <span className="mt-1 line-clamp-2 block text-sm text-muted">
            “{excerpt(withoutTitleLabel(item.excerpt), QUOTE_MAX)}”
          </span>
        )}
      </span>
    </IntentLink>
  );
}

/** "Nova, Kai and 10 others", with the names in bold. */
function Actors({ item }: { item: ActivityItem }) {
  const { named, others } = namedActors(item.actors, item.count);
  const parts = [
    ...named.map((actor) => (
      <span key={actor.id} className="font-semibold">
        {actor.displayName}
      </span>
    )),
    ...(others > 0 ? [<span key="others">{othersPhrase(others)}</span>] : []),
  ];
  return inSentence(parts).map(({ item: part, before }) => (
    <Fragment key={part.key}>
      {before}
      {part}
    </Fragment>
  ));
}
