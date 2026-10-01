"use client";

import { type QueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MemberPresence, Presence } from "@/lib/api/types";
import { queryKeys } from "./keys";

function byMember(list: Presence[]) {
  return new Map(list.map((presence) => [presence.userId, presence]));
}

/**
 * Whether each of these members is online, by id. The first answer comes
 * from the API; after that, live events keep it current.
 */
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

/** A few members who are around, online first. */
export function useMembersAround(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.presenceAround,
    queryFn: () => api<MemberPresence[]>("/presence/around?limit=5"),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * A member came online or went offline: patches every cached answer that
 * mentions them. Someone new arriving isn't in "who's around" yet, so that
 * list is asked for again.
 */
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
