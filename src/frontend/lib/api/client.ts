import { ApiError } from "./problem";

type RequestOptions = Omit<RequestInit, "body"> & {
  /** A body to send as JSON. */
  json?: unknown;
  /** A body to send as is (multipart uploads). */
  body?: BodyInit;
};

let refreshing: Promise<boolean> | null = null;

/**
 * Rotates the session once, however many requests found it expired at the
 * same moment; they all wait for the one refresh.
 */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * Calls the API from the browser through this app's /api/v1 proxy, so the
 * sign-in cookies go along. An expired session is refreshed once and the
 * request retried; any failure throws an ApiError.
 */
export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, headers, ...init } = options;
  const send = () =>
    fetch(`/api/v1${path}`, {
      ...init,
      headers: json === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: json === undefined ? body : JSON.stringify(json),
    });

  let response = await send();
  if (response.status === 401 && !path.startsWith("/auth/") && (await refreshSession())) {
    response = await send();
  }

  if (!response.ok) {
    throw await ApiError.from(response);
  }

  // 202 and 204 answers have no body.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
