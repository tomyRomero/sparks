"use client";

import { keepPreviousData, type QueryClient, useQueries, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MemberPresence, Presence } from "@/lib/api/types";
import { queryKeys } from "./keys";

/** The most members the API answers for at once. */
const MAX_IDS = 100;

/** Fetched once, then kept current by live events. */
export function usePresence(userIds: number[], enabled = true) {
  return usePresenceByGroup([userIds], enabled);
}

/**
 * Presence for a paged list, fetched a group (a page) at a time: a new page
 * asks only about its own members, and the rows already shown keep theirs.
 */
export function usePresenceByGroup(groups: number[][], enabled = true) {
  const batches = groups.flatMap((group) => {
    const ids = Array.from(new Set(group)).sort((a, b) => a - b);
    return Array.from({ length: Math.ceil(ids.length / MAX_IDS) }, (_, index) =>
      ids.slice(index * MAX_IDS, (index + 1) * MAX_IDS),
    );
  });
  return useQueries({
    queries: batches.map((ids) => ({
      queryKey: queryKeys.presenceOf(ids),
      queryFn: () => api<Presence[]>(`/presence?${ids.map((id) => `ids=${id}`).join("&")}`),
      enabled,
      staleTime: 5 * 60_000,
      // A page whose members changed (a new message moved a chat up) keeps
      // its old answers until the new ones arrive, rather than going blank.
      placeholderData: keepPreviousData,
    })),
    combine: (results) =>
      results.some((result) => result.data)
        ? new Map(results.flatMap((result) => result.data ?? []).map((presence) => [presence.userId, presence]))
        : undefined,
  });
}

export function useMembersAround(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.presenceAround,
    queryFn: () => api<MemberPresence[]>("/presence/around?limit=5"),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Patches cached presence, and refetches "who's around" since a newcomer won't be in it. */
export function applyPresence(queryClient: QueryClient, presence: Presence) {
  queryClient.setQueriesData<Presence[]>({ queryKey: ["presence", "of"] }, (list) =>
    list?.map((item) => (item.userId === presence.userId ? presence : item)),
  );

  const around = queryClient.getQueryData<MemberPresence[]>(queryKeys.presenceAround);
  if (around?.some((member) => member.user.id === presence.userId)) {
    queryClient.setQueryData<MemberPresence[]>(queryKeys.presenceAround, (list) =>
      list
        ?.map((member) =>
          member.user.id === presence.userId
            ? { ...member, online: presence.online, lastSeenAt: presence.lastSeenAt }
            : member,
        )
        .sort((a, b) => Number(b.online) - Number(a.online)),
    );
  } else if (presence.online) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.presenceAround });
  }
}
