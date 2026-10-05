"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { UnreadCount } from "@/lib/api/types";
import { queryKeys } from "./keys";

// Refreshed now and then as a fallback; live events refresh them straight away.
const refetchInterval = 60_000;

export function useUnreadActivity(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.unreadActivity,
    queryFn: () => api<UnreadCount>("/activity/unread-count"),
    select: (unread) => unread.count,
    enabled,
    refetchInterval,
  });
}

export function useUnreadMessages(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.unreadMessages,
    queryFn: () => api<UnreadCount>("/conversations/unread-count"),
    select: (unread) => unread.count,
    enabled,
    refetchInterval,
  });
}
