"use client";

import { Search, SquarePen } from "lucide-react";
import { useSelectedLayoutSegment } from "next/navigation";
import { useId, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Hint } from "@/components/ui/hint";
import { IntentLink } from "@/components/ui/intent-link";
import { ListFooter } from "@/components/ui/list-footer";
import type { Conversation, OpaquePage } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { messagePreview } from "@/lib/queries/messages";
import { usePresenceByGroup } from "@/lib/queries/presence";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { NewMessageDialog } from "./new-message-dialog";

export function Inbox({ initial, viewerId }: { initial: OpaquePage<Conversation>; viewerId: number }) {
  const { query, items: conversations } = usePagedList<Conversation, string>(
    "/conversations",
    queryKeys.inbox,
    initial,
  );
  const presence = usePresenceByGroup(
    query.data?.pages.map((page) => page.items.map((conversation) => conversation.with.id)) ?? [],
  );
  const openId = useSelectedLayoutSegment();
  // With a conversation open, the conversation is the page's subject and has
  // its main heading; this list is then a section beside it.
  const Heading = openId === null ? "h1" : "h2";
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState("");
  const filterId = useId();

  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? conversations.filter(
        ({ with: other }) =>
          other.displayName.toLowerCase().includes(needle) || other.username.toLowerCase().includes(needle),
      )
    : conversations;

  return (
    <section aria-labelledby="inbox-title" className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3.5">
        <Heading id="inbox-title" className="font-display text-[26px] font-bold tracking-tight">
          Messages
        </Heading>
        <Hint label="New message" side="bottom">
          <button
            type="button"
            onClick={() => setComposing(true)}
            aria-label="New message"
            className="inline-flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            <SquarePen className="size-5" aria-hidden />
          </button>
        </Hint>
      </header>

      {conversations.length > 0 && (
        <div className="relative px-4 pb-3">
          <label htmlFor={filterId} className="sr-only">
            Search conversations
          </label>
          <Search
            className="pointer-events-none absolute top-[21px] left-8 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id={filterId}
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search conversations"
            autoComplete="off"
            className="h-[42px] w-full rounded-xl border border-line bg-canvas ps-10 pe-3.5 text-sm placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
          />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-24 md:pb-4">
        {conversations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">No messages yet</p>
            <p className="mt-1 text-muted">Start a conversation with anyone on Sparks.</p>
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink hover:bg-brand-hover"
            >
              <SquarePen className="size-4" aria-hidden /> New message
            </button>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">No conversation with “{filter.trim()}”.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {shown.map((conversation) => {
              const { with: other, lastMessage: last } = conversation;
              const unread = conversation.unreadCount > 0;
              const online = presence?.get(other.id)?.online ?? false;
              const open = openId === String(conversation.id);
              return (
                <li key={conversation.id}>
                  <IntentLink
                    href={`/messages/${conversation.id}`}
                    aria-current={open ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-raised",
                      open && "bg-brand-soft hover:bg-brand-soft",
                    )}
                  >
                    <Avatar name={other.displayName} src={other.avatarUrl} size={48} online={online} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn("min-w-0 flex-1 truncate text-[15px]", unread ? "font-bold" : "font-semibold")}
                        >
                          {other.displayName}
                          {online && <span className="sr-only">, online</span>}
                        </span>
                        <time
                          dateTime={conversation.lastMessageAt}
                          title={fullDate(conversation.lastMessageAt)}
                          className={cn("shrink-0 label-mono", unread && "font-semibold text-brand")}
                          suppressHydrationWarning
                        >
                          {timeAgo(conversation.lastMessageAt)}
                        </time>
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13.5px]",
                            unread ? "font-semibold text-ink" : "text-ink-soft",
                          )}
                        >
                          {last && last.senderId === viewerId && "You: "}
                          {last && messagePreview(last, 80)}
                        </span>
                        {unread && (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 font-mono text-[10.5px] font-semibold text-brand-ink">
                            {conversation.unreadCount}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </IntentLink>
                </li>
              );
            })}
          </ul>
        )}
        {!needle && (
          <ListFooter
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            failed={query.isFetchNextPageError}
            error={query.error}
            fetchNextPage={query.fetchNextPage}
            loadingLabel="Loading earlier conversations"
          />
        )}
      </div>

      <NewMessageDialog open={composing} onOpenChange={setComposing} />
    </section>
  );
}
