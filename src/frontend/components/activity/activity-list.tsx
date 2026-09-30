"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ListFooter } from "@/components/ui/list-footer";
import { api } from "@/lib/api/client";
import type { ActivityItem, ActivityKind, OpaquePage } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const kinds: Record<ActivityKind, { verb: string; icon: typeof Heart; tone: string }> = {
  postLike: { verb: "liked your spark", icon: Heart, tone: "bg-like/12 text-like [&_svg]:fill-current" },
  commentLike: { verb: "liked your comment", icon: Heart, tone: "bg-like/12 text-like [&_svg]:fill-current" },
  comment: { verb: "commented on your spark", icon: MessageCircle, tone: "bg-brand-soft text-brand" },
  reply: { verb: "replied to your comment", icon: CornerDownRight, tone: "bg-brand-soft text-brand" },
};

/** Where an item leads: the spark for a like on it, otherwise the comment in its thread. */
function target(item: ActivityItem) {
  return item.commentId === null ? `/p/${item.postId}` : `/c/${item.commentId}`;
}

/**
 * What others did with the member's sparks and comments, newest first. New
 * items stay highlighted for this visit, but are marked read at once so the
 * badge clears; anything arriving later stays unread.
 */
export function ActivityList({ initial }: { initial: OpaquePage<ActivityItem> }) {
  const queryClient = useQueryClient();
  const { query, items } = usePagedList<ActivityItem, string>("/activity", queryKeys.activity, initial);

  // Each visit starts from the server's first page, never from what was
  // cached last time, so new activity and the read state are always current.
  useEffect(() => () => queryClient.removeQueries({ queryKey: queryKeys.activity }), [queryClient]);

  const newest = initial.items[0];
  useEffect(() => {
    if (!newest?.unread) return;
    void api("/activity/read", { method: "POST", json: { upTo: newest.at } }).then(() =>
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadActivity }),
    );
  }, [newest, queryClient]);

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">Nothing yet</p>
        <p className="mt-1 text-muted">When someone likes or comments on your sparks, it shows up here.</p>
      </div>
    );
  }

  return (
    <div>
      <ul>
        {items.map((item) => {
          const { verb, icon: Icon, tone } = kinds[item.kind];
          return (
            <li key={`${item.kind}:${item.at}:${item.actor.id}:${item.commentId ?? item.postId}`}>
              <Link
                href={target(item)}
                className={cn(
                  "relative flex gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-surface/60 sm:px-6",
                  item.unread && "bg-brand-soft/40 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-brand",
                )}
              >
                <span className="relative shrink-0">
                  <Avatar name={item.actor.displayName} src={item.actor.avatarUrl} size={40} />
                  <span
                    className={cn(
                      "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-canvas",
                      tone,
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">
                    {item.unread && <span className="sr-only">New: </span>}
                    <span className="font-semibold">{item.actor.displayName}</span> {verb}
                    <span className="label-mono">
                      {" · "}
                      <time dateTime={item.at} title={fullDate(item.at)} suppressHydrationWarning>
                        {timeAgo(item.at)}
                      </time>
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted">“{item.excerpt}”</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        error={query.error}
        fetchNextPage={query.fetchNextPage}
        loadingLabel="Loading earlier activity"
      />
    </div>
  );
}
