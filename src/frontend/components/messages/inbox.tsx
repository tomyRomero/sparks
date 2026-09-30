"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ListFooter } from "@/components/ui/list-footer";
import type { Conversation, OpaquePage } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * The member's conversations, latest message first. New messages reorder it
 * live: the live connection refreshes this list whenever one arrives.
 */
export function Inbox({ initial, viewerId }: { initial: OpaquePage<Conversation>; viewerId: number }) {
  const { query, items: conversations } = usePagedList<Conversation, string>("/conversations", queryKeys.inbox, initial);
  if (conversations.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No messages yet</p>
        <p className="mt-1 text-muted">Start a conversation from anyone&apos;s profile.</p>
      </div>
    );
  }

  return (
    <div>
      <ul>
        {conversations.map((conversation) => {
          const last = conversation.lastMessage;
          const unread = conversation.unreadCount > 0;
          return (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-surface/60 sm:px-6"
              >
                <Avatar name={conversation.with.displayName} src={conversation.with.avatarUrl} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn("truncate", unread ? "font-bold" : "font-semibold")}>
                      {conversation.with.displayName}
                    </span>
                    <span className="label-mono">@{conversation.with.username}</span>
                    <time
                      dateTime={conversation.lastMessageAt}
                      title={fullDate(conversation.lastMessageAt)}
                      className="ml-auto shrink-0 label-mono"
                      suppressHydrationWarning
                    >
                      {timeAgo(conversation.lastMessageAt)}
                    </time>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={cn("truncate text-sm", unread ? "text-ink" : "text-muted")}>
                      {last && last.senderId === viewerId && "You: "}
                      {last?.body}
                    </span>
                    {unread && (
                      <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 font-mono text-[10px] font-semibold text-brand-ink">
                        {conversation.unreadCount}
                        <span className="sr-only"> unread</span>
                      </span>
                    )}
                  </span>
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
        loadingLabel="Loading earlier conversations"
      />
    </div>
  );
}
