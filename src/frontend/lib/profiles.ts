import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { serverGetOrNull } from "@/lib/api/server";
import type { Profile } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { USERNAME_PATTERN } from "@/lib/limits";

/** Cached per request; null when there's no such member. */
export const getProfile = cache((username: string) =>
  USERNAME_PATTERN.test(username) ? serverGetOrNull<Profile>(`/api/v1/users/${username}`) : null,
);

/**
 * What a list under a profile needs: the viewer, the member, and the first
 * page of one of their lists (`/users/{username}/{list}`). A member or list
 * that doesn't exist is the page's 404.
 */
export async function getProfileList<T>(username: string, list: string) {
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();
  const path = `/users/${profile.username}/${list}`;
  const first = await serverGetOrNull<T>(`/api/v1${path}`);
  if (!first) notFound();
  return { viewer, profile, path, first, own: viewer?.id === profile.id };
}
