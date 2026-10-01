"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserRound, WifiOff } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { Conversation, CurrentUser, CursorPage, Message, Post, SharedSpark, UserSummary } from "@/lib/api/types";
import { groupChat } from "@/lib/chat";
import { queryKeys } from "@/lib/queries/keys";
import { addCachedMessage, markCachedMessagesRead, messagePreview } from "@/lib/queries/messages";
import { usePresence } from "@/lib/queries/presence";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { useLive } from "@/lib/realtime/live";
import { clockTime, dayLabel, fullDate, lastActive } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ChatComposer } from "./chat-composer";
import { SharedSparkCard } from "./shared-spark-card";

/** How long "typing…" shows after the last typing signal. */
const TYPING_SHOWN_MS = 4000;

type ChatProps = { conversation: Conversation; initial: CursorPage<Message>; viewer: CurrentUser };

/**
 * A message shown straight away while it's on its way to the server, or
 * after it failed to get there: some text, a shared spark, or both.
 */
type Outgoing = { key: number; body: string; sharedPost: SharedSpark | null; failed: boolean };

/**
 * One conversation, oldest message at the top, grouped by day and into runs
 * from one sender. New messages arrive live and are marked read while the
 * tab is visible; the other participant sees when.
 */
export function Chat({ conversation, initial, viewer }: ChatProps) {
  const queryClient = useQueryClient();
  const live = useLive();
  const { id, with: other } = conversation;
  const { query, items: newestFirst } = usePagedList(`/conversations/${id}/messages`, queryKeys.messages(id), initial);
  const messages = newestFirst.toReversed();
  const presence = usePresence([other.id])?.get(other.id);
  const visible = useDocumentVisible();
  const [typing, setTyping] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [outbox, setOutbox] = useState<Outgoing[]>([]);
  const nextKey = useRef(0);

  // Each visit starts from the server's latest messages, never an old cache.
  useEffect(() => () => queryClient.removeQueries({ queryKey: queryKeys.messages(id) }), [queryClient, id]);

  // Their typing, and their messages for screen readers.
  useEffect(() => {
    if (!live) return;
    let timer: number | undefined;
    const stopTyping = live.on("Typing", (event) => {
      if (event.conversationId !== id || event.userId !== other.id) return;
      setTyping(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTyping(false), TYPING_SHOWN_MS);
    });
    const stopMessages = live.on("MessageReceived", (message) => {
      if (message.conversationId !== id || message.senderId !== other.id) return;
      window.clearTimeout(timer);
      setTyping(false);
      setAnnouncement(`${other.displayName}: ${messagePreview(message, 200)}`);
    });
    return () => {
      window.clearTimeout(timer);
      stopTyping();
      stopMessages();
    };
  }, [live, id, other.id, other.displayName]);

  // Mark their messages read, up to the newest one shown, while the tab is visible.
  const newestFromThem = newestFirst.find((message) => message.senderId !== viewer.id);
  const unreadUpTo = newestFromThem && newestFromThem.readAt === null ? newestFromThem.id : null;
  useEffect(() => {
    if (unreadUpTo === null || !visible) return;
    api(`/conversations/${id}/read`, { method: "POST", json: { upToMessageId: unreadUpTo } })
      .then(() => {
        markCachedMessagesRead(queryClient, {
          conversationId: id,
          readerId: viewer.id,
          upToMessageId: unreadUpTo,
          readAt: new Date().toISOString(),
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessages });
        void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      })
      .catch(() => {
        // Stays unread; the next message or visit tries again.
      });
  }, [unreadUpTo, visible, id, viewer.id, queryClient]);

  // Scrolling: start at the newest message, follow new ones while the reader
  // is at the bottom (or sent it), and hold still when older ones load above.
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const fromBottom = useRef<number | null>(null);
  const newest = newestFirst[0];
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && (atBottom.current || newest?.senderId === viewer.id)) {
      element.scrollTop = element.scrollHeight;
    }
  }, [newest?.id, newest?.senderId, viewer.id, typing]);
  const oldestId = messages[0]?.id;
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && fromBottom.current !== null) {
      element.scrollTop = element.scrollHeight - fromBottom.current;
      fromBottom.current = null;
    }
  }, [oldestId]);

  // A message the member just wrote always scrolls into view.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element && outbox.length > 0) element.scrollTop = element.scrollHeight;
  }, [outbox.length]);

  function loadEarlier() {
    const element = scroller.current;
    if (element) fromBottom.current = element.scrollHeight - element.scrollTop;
    void query.fetchNextPage();
  }

  // Sending shows the message at once; the server's copy replaces it when it
  // arrives. A failed one stays, with its content, until it's retried or removed.
  async function deliver(item: Outgoing) {
    try {
      const message = await api<Message>(`/conversations/${id}/messages`, {
        method: "POST",
        json: { body: item.body, sharedPostId: item.sharedPost?.id },
      });
      addCachedMessage(queryClient, message);
      setOutbox((items) => items.filter((queued) => queued.key !== item.key));
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
    } catch {
      setOutbox((items) => items.map((queued) => (queued.key === item.key ? { ...queued, failed: true } : queued)));
    }
  }

  function queue(body: string, sharedPost: SharedSpark | null) {
    const item = { key: ++nextKey.current, body, sharedPost, failed: false };
    setOutbox((items) => [...items, item]);
    void deliver(item);
  }

  function retry(item: Outgoing) {
    setOutbox((items) => items.map((queued) => (queued.key === item.key ? { ...queued, failed: false } : queued)));
    void deliver({ ...item, failed: false });
  }

  function discard(item: Outgoing) {
    setOutbox((items) => items.filter((queued) => queued.key !== item.key));
  }

  const days = groupChat(messages);
  const lastMine = newestFirst.find((message) => message.senderId === viewer.id);
  const status = typing
    ? { text: "typing…", tone: "text-brand" }
    : presence?.online
      ? { text: "Online", tone: "text-success" }
      : presence?.lastSeenAt
        ? { text: lastActive(presence.lastSeenAt), tone: "text-muted" }
        : null;

  return (
    <section aria-labelledby="chat-title" className="flex h-dvh min-w-0 flex-1 flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-surface py-3 ps-2 pe-3 sm:ps-6 sm:pe-6 lg:ps-6">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-raised lg:hidden"
        >
          <ArrowLeft className="size-[22px]" aria-hidden />
        </Link>
        <Avatar name={other.displayName} src={other.avatarUrl} size={42} online={presence?.online ?? false} />
        <div className="min-w-0 flex-1">
          <h1 id="chat-title" className="truncate font-display text-lg leading-tight font-bold">
            {other.displayName}
          </h1>
          {status && (
            <p className={cn("truncate font-mono text-[11.5px] leading-4", status.tone)} suppressHydrationWarning>
              {status.text}
            </p>
          )}
        </div>
        <Button asChild variant="secondary" size="sm" className="h-[38px] rounded-[11px] max-sm:hidden">
          <Link href={`/u/${other.username}`}>View profile</Link>
        </Button>
        <Link
          href={`/u/${other.username}`}
          aria-label={`${other.displayName}'s profile`}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-raised sm:hidden"
        >
          <UserRound className="size-5" aria-hidden />
        </Link>
      </header>

      <Offline connected={live?.connected ?? true} />

      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-8"
      >
        {/* A short conversation sits just above the message box, as chats do. */}
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end">
          {query.hasNextPage && (
            <div className="mb-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={loadEarlier} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? "Loading…" : "Load earlier messages"}
              </Button>
            </div>
          )}

          {messages.length === 0 && outbox.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Avatar name={other.displayName} src={other.avatarUrl} size={72} />
              <p className="font-display text-lg font-semibold">Say hello to {other.displayName}</p>
              <p className="max-w-xs text-sm text-muted">Send a message, or share one of your sparks with the bolt.</p>
            </div>
          )}

          {days.map((day) => (
            <section key={day.day} aria-label={dayLabel(day.day)} suppressHydrationWarning>
              <h2
                className="my-4 flex items-center gap-3.5 font-mono text-[11px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line"
                suppressHydrationWarning
              >
                {dayLabel(day.day)}
              </h2>
              {day.runs.map((run) => {
                const mine = run.senderId === viewer.id;
                const last = run.messages.at(-1)!;
                return (
                  <Fragment key={run.messages[0].id}>
                    <ol
                      aria-label={mine ? "You" : other.displayName}
                      className={cn("mt-3 flex flex-col gap-1", mine ? "items-end" : "items-start")}
                    >
                      {run.messages.map((message, index) => (
                        <li
                          key={message.id}
                          title={fullDate(message.createdAt)}
                          suppressHydrationWarning
                          className={cn(
                            "flex max-w-[88%] items-end gap-2.5 sm:max-w-[75%]",
                            !mine && index < run.messages.length - 1 && "ps-10",
                          )}
                        >
                          {!mine && index === run.messages.length - 1 && (
                            <Avatar name={other.displayName} src={other.avatarUrl} size={30} />
                          )}
                          <MessageContent
                            message={message}
                            mine={mine}
                            first={index === 0}
                            sender={mine ? null : other}
                          />
                        </li>
                      ))}
                    </ol>
                    <p className={cn("mt-1 mb-1.5 label-mono", mine ? "text-right" : "ps-10")}>
                      <time dateTime={last.createdAt} suppressHydrationWarning>
                        {clockTime(last.createdAt)}
                      </time>
                      {last.id === lastMine?.id && outbox.length === 0 && (last.readAt ? " · Seen" : " · Sent")}
                    </p>
                  </Fragment>
                );
              })}
            </section>
          ))}

          {outbox.length > 0 && (
            <ol aria-label="Messages you're sending" className="mt-3 flex flex-col items-end gap-1">
              {outbox.map((item) => (
                <li key={item.key} className="flex max-w-[88%] flex-col items-end sm:max-w-[75%]">
                  <div className={cn(item.failed ? "opacity-50" : "opacity-70")}>
                    <MessageContent
                      message={{ body: item.body, sharedPost: item.sharedPost }}
                      mine
                      first={false}
                      sender={null}
                    />
                  </div>
                  {item.failed ? (
                    <span role="alert" className="mt-1 flex items-center gap-2 text-xs text-danger">
                      Not sent.
                      <button type="button" onClick={() => retry(item)} className="font-semibold hover:underline">
                        Retry
                      </button>
                      <button type="button" onClick={() => discard(item)} className="text-muted hover:underline">
                        Remove
                      </button>
                    </span>
                  ) : (
                    <span className="mt-1 label-mono">Sending…</span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {typing && (
            <div className="mt-3 flex items-end gap-2.5">
              <Avatar name={other.displayName} src={other.avatarUrl} size={30} />
              <span className="inline-flex items-center gap-1.5 rounded-[20px] rounded-bl-md border border-line bg-surface px-4 py-3.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    aria-hidden
                    className="size-[7px] animate-typing rounded-full bg-muted"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
                <span className="sr-only">{other.displayName} is typing</span>
              </span>
            </div>
          )}
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </div>
      </div>

      <ChatComposer
        name={other.displayName}
        username={viewer.username}
        onSend={(body) => queue(body, null)}
        onShare={(post) => queue("", sharedFrom(post))}
        onTyping={() => live?.typing(id)}
      />
    </section>
  );
}

type MessageContentProps = {
  message: Pick<Message, "body" | "sharedPost">;
  mine: boolean;
  /** The first in its run: a shared spark there gets a line saying who shared it. */
  first: boolean;
  /** Who sent it, when it wasn't the viewer. */
  sender: UserSummary | null;
};

/** What a message holds: a shared spark, its text, or a note that the spark is gone. */
function MessageContent({ message, mine, first, sender }: MessageContentProps) {
  const who = mine ? "You" : sender!.displayName;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", mine ? "items-end" : "items-start")}>
      {message.sharedPost && (
        <>
          {first && !message.body && <span className="mb-0.5 label-mono">{who} shared a spark</span>}
          <span className="sr-only">{who} shared a spark: </span>
          <SharedSparkCard spark={message.sharedPost} mine={mine} />
        </>
      )}
      {message.body && (
        <p
          className={cn(
            "rounded-[20px] px-4 py-2.5 text-[15px] leading-normal break-words whitespace-pre-wrap",
            mine ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md border border-line bg-surface text-ink",
            !first && (mine ? "rounded-tr-md" : "rounded-tl-md"),
          )}
        >
          <span className="sr-only">{who}: </span>
          {message.body}
        </p>
      )}
      {!message.body && !message.sharedPost && (
        <p
          className={cn(
            "rounded-[20px] border border-dashed border-line-strong px-4 py-2.5 text-sm text-muted italic",
            mine ? "rounded-br-md" : "rounded-bl-md",
          )}
        >
          {who} shared a spark that&apos;s since been deleted.
        </p>
      )}
    </div>
  );
}

/** A spark from a list, as a message shows it while it's on its way. */
function sharedFrom(post: Post): SharedSpark {
  return {
    id: post.id,
    kind: post.kind,
    body: post.body,
    imageUrl: post.imageUrl,
    author: post.author,
    createdAt: post.createdAt,
  };
}

/** Whether this tab is the one being looked at. */
function useDocumentVisible() {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);
      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}

/** Says so when the live connection has been down for a few seconds, not on every blip. */
function Offline({ connected }: { connected: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (connected) return;
    const timer = window.setTimeout(() => setShown(true), 3000);
    return () => {
      window.clearTimeout(timer);
      setShown(false);
    };
  }, [connected]);

  if (!shown) return null;
  return (
    <p
      role="status"
      className="flex items-center gap-2 border-b border-line bg-raised px-4 py-2 text-sm text-muted sm:px-6"
    >
      <WifiOff className="size-4" aria-hidden />
      Reconnecting… You can still send; new messages appear once you&apos;re back.
    </p>
  );
}
