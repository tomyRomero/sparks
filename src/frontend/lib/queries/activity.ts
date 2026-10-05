"use client";

import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ActivityItem, OpaquePage } from "@/lib/api/types";
import { queryKeys } from "./keys";

type ActivityPages = InfiniteData<OpaquePage<ActivityItem>>;

/** Marks activity read up to a moment and refreshes the badge. */
export async function markActivityRead(queryClient: QueryClient, upTo: string) {
  await api("/activity/read", { method: "POST", json: { upTo } });
  await queryClient.invalidateQueries({ queryKey: queryKeys.unreadActivity });
}

/**
 * Marks everything read: up to now, or to the newest item loaded if the
 * server's clock is ahead of this one. Loaded items lose their highlight.
 */
export async function markAllActivityRead(queryClient: QueryClient) {
  const loaded = queryClient
    .getQueriesData<ActivityPages>({ queryKey: queryKeys.activity })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? []);
  const newest = Math.max(Date.now(), ...loaded.map((item) => Date.parse(item.at)));
  await markActivityRead(queryClient, new Date(newest).toISOString());
  queryClient.setQueriesData<ActivityPages>({ queryKey: queryKeys.activity }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => ({ ...item, unread: false })),
          })),
        }
      : data,
  );
}
