"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SendHorizontal, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { Conversation, CurrentUser, CursorPage, Message } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { queryKeys } from "@/lib/queries/keys";
import { addCachedMessage, markCachedMessagesRead } from "@/lib/queries/messages";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { useLive } from "@/lib/realtime/live";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Messages from one sender this close together read as one run, with one timestamp. */
const RUN_GAP_MS = 5 * 60_000;
/** How long "typing…" shows after the last typing signal. */
const TYPING_SHOWN_MS = 4000;
/** How often the member's typing is signalled while they type. */
const TYPING_SIGNAL_MS = 3000;

type ChatProps = { conversation: Conversation; initial: CursorPage<Message>; viewer: CurrentUser };

/** A message shown straight away while it's on its way to the server, or after it failed to get there. */
type Outgoing = { key: number; body: string; failed: boolean };

/**
 * One conversation, oldest message at the top. New messages arrive live and
 * are marked read while the tab is visible; the other participant sees when.
 */
export function Chat({ conversation, initial, viewer }: ChatProps) {
  const queryClient = useQueryClient();
  const live = useLive();
  const { id, with: other } = conversation;
  const { query, items: newestFirst } = usePagedList(`/conversations/${id}/messages`, queryKeys.messages(id), initial);
  const messages = newestFirst.toReversed();
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
      setAnnouncement(`${other.displayName}: ${message.body}`);
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
  // arrives. A failed one stays, with the text, until it's retried or removed.
  async function deliver(item: Outgoing) {
    try {
      const message = await api<Message>(`/conversations/${id}/messages`, {
        method: "POST",
        json: { body: item.body },
      });
      addCachedMessage(queryClient, message);
      setOutbox((items) => items.filter((other) => other.key !== item.key));
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
    } catch {
      setOutbox((items) => items.map((other) => (other.key === item.key ? { ...other, failed: true } : other)));
    }
  }

  function send(body: string) {
    const item = { key: ++nextKey.current, body, failed: false };
    setOutbox((items) => [...items, item]);
    void deliver(item);
  }

  function retry(item: Outgoing) {
    setOutbox((items) => items.map((other) => (other.key === item.key ? { ...other, failed: false } : other)));
    void deliver({ ...item, failed: false });
  }

  function discard(item: Outgoing) {
    setOutbox((items) => items.filter((other) => other.key !== item.key));
  }

  const lastMine = newestFirst.find((message) => message.senderId === viewer.id);
  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col md:h-dvh">
      <PageHeader title={other.displayName} back="/messages">
        <Link
          href={`/u/${other.username}`}
          className="shrink-0 rounded-full"
          aria-label={`${other.displayName}'s profile`}
        >
          <Avatar name={other.displayName} src={other.avatarUrl} size={32} />
        </Link>
      </PageHeader>

      <Offline connected={live?.connected ?? true} />

      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          atBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {/* A short conversation sits just above the message box, as chats do. */}
        <div className="flex min-h-full flex-col justify-end">
          {query.hasNextPage && (
            <div className="mb-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={loadEarlier} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage ? "Loading…" : "Load earlier messages"}
              </Button>
            </div>
          )}
          {messages.length === 0 && outbox.length === 0 ? (
            <p className="py-16 text-center text-muted">Say hello to {other.displayName}.</p>
          ) : (
            <ol aria-label={`Messages with ${other.displayName}`}>
              {messages.map((message, index) => {
                const mine = message.senderId === viewer.id;
                const before = messages[index - 1];
                const after = messages[index + 1];
                const startsRun = !before || !sameRun(before, message);
                const endsRun = !after || !sameRun(message, after);
                return (
                  <li
                    key={message.id}
                    className={cn("flex flex-col", mine ? "items-end" : "items-start", startsRun ? "mt-3" : "mt-0.5")}
                  >
                    <p
                      title={fullDate(message.createdAt)}
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 leading-relaxed break-words whitespace-pre-wrap",
                        mine ? "bg-brand text-brand-ink" : "bg-raised text-ink",
                        mine ? !endsRun && "rounded-br-md" : !endsRun && "rounded-bl-md",
                        mine ? !startsRun && "rounded-tr-md" : !startsRun && "rounded-tl-md",
                      )}
                    >
                      <span className="sr-only">{mine ? "You" : other.displayName}: </span>
                      {message.body}
                    </p>
                    {endsRun && (
                      <span className="mt-1 label-mono">
                        <time dateTime={message.createdAt} suppressHydrationWarning>
                          {timeAgo(message.createdAt)}
                        </time>
                        {message.id === lastMine?.id && (message.readAt ? " · Seen" : " · Sent")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          {outbox.length > 0 && (
            <ol aria-label="Messages you're sending">
              {outbox.map((item) => (
                <li key={item.key} className="mt-0.5 flex flex-col items-end">
                  <p
                    className={cn(
                      "max-w-[80%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 leading-relaxed break-words whitespace-pre-wrap text-brand-ink",
                      item.failed ? "opacity-50" : "opacity-70",
                    )}
                  >
                    <span className="sr-only">You: </span>
                    {item.body}
                  </p>
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
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <TypingDots />
              {other.displayName} is typing…
            </p>
          )}
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </div>
      </div>

      <ChatComposer name={other.displayName} onSend={send} onTyping={() => live?.typing(id)} />
    </div>
  );
}

function sameRun(earlier: Message, later: Message) {
  return (
    earlier.senderId === later.senderId &&
    new Date(later.createdAt).getTime() - new Date(earlier.createdAt).getTime() < RUN_GAP_MS
  );
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

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

type ChatComposerProps = {
  name: string;
  onSend: (body: string) => void;
  onTyping: () => void;
};

/** The message box: Enter sends, Shift+Enter starts a new line. */
function ChatComposer({ name, onSend, onTyping }: ChatComposerProps) {
  const [text, setText] = useState("");
  const lastSignal = useRef(0);

  function send() {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="border-t border-line bg-canvas px-4 py-3 sm:px-6"
    >
      <div className="flex items-end gap-2">
        <Textarea
          aria-label={`Message ${name}`}
          placeholder="Write a message…"
          rows={1}
          value={text}
          maxLength={limits.messageBodyMax}
          onChange={(event) => {
            setText(event.target.value);
            if (Date.now() - lastSignal.current > TYPING_SIGNAL_MS) {
              lastSignal.current = Date.now();
              onTyping();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
          className="[field-sizing:content] max-h-40 min-h-11 resize-none"
        />
        <Button type="submit" size="icon" className="size-11 rounded-full" disabled={!text.trim()}>
          <SendHorizontal aria-hidden />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </form>
  );
}
