"use client";

import { type QueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MemberPresence, Presence } from "@/lib/api/types";
import { queryKeys } from "./keys";

function byMember(list: Presence[]) {
  return new Map(list.map((presence) => [presence.userId, presence]));
}

/** Fetched once, then kept current by live events. */
export function usePresence(userIds: number[], enabled = true) {
  const ids = Array.from(new Set(userIds)).sort((a, b) => a - b);
  const { data } = useQuery({
    queryKey: queryKeys.presenceOf(ids),
    queryFn: () => api<Presence[]>(`/presence?${ids.map((id) => `ids=${id}`).join("&")}`),
    select: byMember,
    enabled: enabled && ids.length > 0,
    staleTime: 5 * 60_000,
  });
  return data;
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
