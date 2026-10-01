import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api/problem";
import { ACCESS_COOKIE, serverFetch } from "@/lib/api/server";
import type { CurrentUser } from "@/lib/api/types";

/** Cached per request. The proxy already refreshed the session, so no cookie means a guest. */
export const getViewer = cache(async (): Promise<CurrentUser | null> => {
  if (!(await cookies()).has(ACCESS_COOKIE)) {
    return null;
  }

  const response = await serverFetch("/api/v1/auth/me");
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw await ApiError.from(response);
  }
  return (await response.json()) as CurrentUser;
});

/** The signed-in member; guests are sent to sign in and brought back after. */
export async function requireViewer(returnTo: string): Promise<CurrentUser> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  }
  return viewer;
}
