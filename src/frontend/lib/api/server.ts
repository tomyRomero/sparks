import "server-only";

import { cookies, headers } from "next/headers";
import { ApiError } from "./problem";

const apiUrl = process.env.API_URL ?? "http://localhost:5100";

/** The access cookie the API sets; read here to call the API as the member. */
export const ACCESS_COOKIE = "sparks_access";

/**
 * Calls the API from the server, as the member whose request is being
 * rendered: the access token travels as a bearer header, and the member's
 * address as X-Forwarded-For so per-address limits see them, not this server.
 */
export async function serverFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const requestHeaders = new Headers(init.headers);
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // The last address is the one this server saw; any before it are what the
  // client claimed, and forwarding those would let it pick its own limits.
  const forwardedFor = (await headers()).get("x-forwarded-for");
  const clientAddress = forwardedFor?.split(",").at(-1)?.trim();
  if (clientAddress) {
    requestHeaders.set("X-Forwarded-For", clientAddress);
  }

  return fetch(`${apiUrl}${path}`, { ...init, headers: requestHeaders, cache: "no-store" });
}

/** GETs JSON from the API; any failure throws an ApiError. */
export async function serverGet<T>(path: string): Promise<T> {
  const response = await serverFetch(path);
  if (!response.ok) {
    throw await ApiError.from(response);
  }
  return (await response.json()) as T;
}

/** Like serverGet, but a 404 is null, for pages that show not-found. */
export async function serverGetOrNull<T>(path: string): Promise<T | null> {
  const response = await serverFetch(path);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw await ApiError.from(response);
  }
  return (await response.json()) as T;
}
