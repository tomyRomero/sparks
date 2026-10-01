"use client";

import { useSyncExternalStore } from "react";

const never = () => () => {};

/** False on the server and while hydrating, true after: for what only the browser knows. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
}
