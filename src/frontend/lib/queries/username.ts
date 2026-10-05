"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { UsernameAvailability } from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/forms";
import { queryKeys } from "./keys";

export type UsernameStatus = "unknown" | "checking" | "free" | "taken";

/** Debounced availability check for well-formed names; sign-up has the last word. */
export function useUsernameStatus(username: string, wellFormed: boolean): UsernameStatus {
  const settled = useDebouncedValue(username, 400);
  const waiting = settled !== username;
  const query = useQuery({
    queryKey: queryKeys.usernameFree(settled),
    queryFn: async ({ signal }) => {
      const answer = await api<UsernameAvailability>(
        `/auth/username-available?username=${encodeURIComponent(settled)}`,
        { signal },
      );
      return answer.available;
    },
    enabled: wellFormed && !waiting,
    staleTime: 60_000,
    retry: false,
  });

  if (!wellFormed) return "unknown";
  if (waiting || query.isFetching) return "checking";
  if (query.data === true) return "free";
  if (query.data === false) return "taken";
  return "unknown";
}
