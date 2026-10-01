"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CursorPage, UserSummary } from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/forms";
import { queryKeys } from "./keys";

/**
 * Members matching what's typed, for pickers: asked once the typing pauses,
 * with the last answer kept on screen while the next one loads.
 */
export function useMemberLookup(text: string) {
  const term = useDebouncedValue(text.trim(), 250);
  const query = useQuery({
    queryKey: queryKeys.memberLookup(term),
    queryFn: () => api<CursorPage<UserSummary>>(`/users?q=${encodeURIComponent(term)}&limit=8`),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  });
  return { term, query };
}
