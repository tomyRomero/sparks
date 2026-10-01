import "server-only";

import { cache } from "react";
import { serverGetOrNull } from "@/lib/api/server";
import type { Profile } from "@/lib/api/types";

/** The API's username rule (InputLimits.UsernamePattern). */
const USERNAME = /^[A-Za-z0-9_]{3,30}$/;

/** Cached per request; null when there's no such member. */
export const getProfile = cache((username: string) =>
  USERNAME.test(username) ? serverGetOrNull<Profile>(`/api/v1/users/${username}`) : null,
);
