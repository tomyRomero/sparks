"use client";

import { type HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, refreshSession } from "@/lib/api/client";
import type { Conversation, Message, MessagesReadEvent, Presence, TypingEvent } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { addCachedMessage, markCachedMessagesRead, messagePreview } from "@/lib/queries/messages";
import { applyPresence } from "@/lib/queries/presence";

/** The events the API pushes (IRealtimeClient.cs), by name. */
type LiveEvents = {
  MessageReceived: Message;
  MessagesRead: MessagesReadEvent;
  Typing: TypingEvent;
  PresenceChanged: Presence;
};
type LiveEvent = keyof LiveEvents;
type Handler<E extends LiveEvent> = (payload: LiveEvents[E]) => void;
type AnyHandler = (payload: never) => void;

type Live = {
  /** Whether the connection is up. While it's down, lists catch up when it returns. */
  connected: boolean;
  /** Listens for an event; returns the way to stop. */
  on: <E extends LiveEvent>(event: E, handler: Handler<E>) => () => void;
  /** Tells the other participant the member is typing. Dropped while offline. */
  typing: (conversationId: number) => void;
};

const LiveContext = createContext<Live | null>(null);

/** The live connection, or null for guests (there's no provider for them). */
export function useLive(): Live | null {
  return useContext(LiveContext);
}

/** Longest wait between attempts to start the connection again. */
const MAX_BACKOFF_MS = 30_000;

/**
 * One live connection per signed-in member, to the API's hub through this
 * app's /hubs proxy, so the sign-in cookie goes along. Listeners are kept
 * apart from the connection, so reconnecting never loses them. When the
 * connection drops for good, most often because the access token it opened
 * with expired, the session is refreshed and the connection started again.
 */
export function LiveProvider({ viewerId, children }: { viewerId: number; children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const handlers = useRef(new Map<LiveEvent, Set<AnyHandler>>());
  const connection = useRef<HubConnection | null>(null);

  // The long-lived handlers read these without restarting the connection.
  const here = useRef({ pathname, router });
  useEffect(() => {
    here.current = { pathname, router };
  }, [pathname, router]);

  useEffect(() => {
    const hub = new HubConnectionBuilder()
      .withUrl("/hubs/live")
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();
    connection.current = hub;

    const dispatch = <E extends LiveEvent>(event: E, payload: LiveEvents[E]) =>
      handlers.current.get(event)?.forEach((handler) => (handler as Handler<E>)(payload));

    // Anything could have happened while the connection was down.
    const catchUp = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessages });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.presence });
    };

    /** A toast for a message that arrives while its conversation isn't open. */
    const announce = async (message: Message) => {
      const path = `/messages/${message.conversationId}`;
      if (here.current.pathname === path) return;
      const conversation = await queryClient
        .fetchQuery({
          queryKey: queryKeys.conversation(message.conversationId),
          queryFn: () => api<Conversation>(`/conversations/${message.conversationId}`),
          staleTime: 5 * 60_000,
        })
        .catch(() => null);
      toast(conversation?.with.displayName ?? "New message", {
        description: messagePreview(message, 80),
        action: { label: "Open", onClick: () => here.current.router.push(path) },
      });
    };

    hub.on("MessageReceived", (message: Message) => {
      addCachedMessage(queryClient, message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      if (message.senderId !== viewerId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessages });
        void announce(message);
      }
      dispatch("MessageReceived", message);
    });
    hub.on("MessagesRead", (read: MessagesReadEvent) => {
      markCachedMessagesRead(queryClient, read);
      dispatch("MessagesRead", read);
    });
    hub.on("Typing", (typing: TypingEvent) => dispatch("Typing", typing));
    hub.on("PresenceChanged", (presence: Presence) => {
      applyPresence(queryClient, presence);
      dispatch("PresenceChanged", presence);
    });

    let stopped = false;
    let attempt = 0;
    let retry: number | undefined;
    const start = async () => {
      try {
        await hub.start();
        attempt = 0;
        setConnected(true);
        catchUp();
      } catch {
        if (stopped) return;
        await refreshSession();
        retry = window.setTimeout(start, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++));
      }
    };

    hub.onreconnecting(() => setConnected(false));
    hub.onreconnected(() => {
      setConnected(true);
      catchUp();
    });
    hub.onclose(() => {
      setConnected(false);
      if (!stopped) void start();
    });
    void start();

    return () => {
      stopped = true;
      window.clearTimeout(retry);
      connection.current = null;
      void hub.stop();
    };
  }, [queryClient, viewerId]);

  const on = useCallback(<E extends LiveEvent>(event: E, handler: Handler<E>) => {
    const listeners = handlers.current.get(event) ?? new Set<AnyHandler>();
    listeners.add(handler as AnyHandler);
    handlers.current.set(event, listeners);
    return () => {
      listeners.delete(handler as AnyHandler);
    };
  }, []);

  const typing = useCallback((conversationId: number) => {
    const hub = connection.current;
    if (hub?.state === HubConnectionState.Connected) {
      void hub.send("Typing", conversationId).catch(() => {});
    }
  }, []);

  const live = useMemo(() => ({ connected, on, typing }), [connected, on, typing]);
  return <LiveContext value={live}>{children}</LiveContext>;
}
