"use client";

import { useSyncExternalStore } from "react";

// Kept in this browser only. Storage can be blocked (private windows,
// site data turned off), in which case there's simply no history.
const STORAGE_KEY = "sparks:recent-searches";
const KEEP = 6;

const none: string[] = [];
const listeners = new Set<() => void>();
// The parsed list for the stored text, so every read between writes is the same array.
let cached: { raw: string | null; list: string[] } = { raw: null, list: none };

function read(): string[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return none;
  }
  if (raw === cached.raw) return cached.list;

  let list = none;
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) list = parsed.filter((item) => typeof item === "string").slice(0, KEEP);
  } catch {
    // Unreadable: start again.
  }
  cached = { raw, list };
  return list;
}

function write(list: string[]) {
  try {
    if (list.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab's searches.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The latest searches, newest first; empty on the server. */
export function useRecentSearches(): string[] {
  return useSyncExternalStore(subscribe, read, () => none);
}

export function rememberSearch(term: string) {
  const q = term.trim();
  if (!q) return;
  write([q, ...read().filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, KEEP));
}

export function forgetSearch(term: string) {
  write(read().filter((item) => item !== term));
}

export function forgetAllSearches() {
  write([]);
}
