import "server-only";

import { cache } from "react";
import { serverGetOrNull } from "@/lib/api/server";
import type { Profile } from "@/lib/api/types";

/** The API's username rule (InputLimits.UsernamePattern). */
const USERNAME = /^[A-Za-z0-9_]{3,30}$/;

/**
 * A member's profile, or null when there's no such member. Asked once per
 * request, however many layouts, pages and metadata need it.
 */
export const getProfile = cache((username: string) =>
  USERNAME.test(username) ? serverGetOrNull<Profile>(`/api/v1/users/${username}`) : null,
);
