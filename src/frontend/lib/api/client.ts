import { ApiError } from "./problem";

type RequestOptions = Omit<RequestInit, "body"> & {
  /** A body to send as JSON. */
  json?: unknown;
  /** A body to send as is (multipart uploads). */
  body?: BodyInit;
};

type RefreshResult = "refreshed" | "signed-out" | "unavailable";

let refreshing: Promise<RefreshResult> | null = null;

/** One refresh shared by every request that found the session expired. */
export function refreshSession(): Promise<RefreshResult> {
  refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST" })
    .then((response): RefreshResult => {
      if (response.ok) return "refreshed";
      return response.status === 401 ? "signed-out" : "unavailable";
    })
    .catch((): RefreshResult => "unavailable")
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Fetch through the /api/v1 rewrite; retries once after refreshing an expired session. */
export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, headers, ...init } = options;
  const send = () =>
    fetch(`/api/v1${path}`, {
      ...init,
      headers: json === undefined ? headers : { "Content-Type": "application/json", ...headers },
      body: json === undefined ? body : JSON.stringify(json),
    });

  let response = await send();
  if (response.status === 401 && !path.startsWith("/auth/") && (await refreshSession()) === "refreshed") {
    response = await send();
  }

  if (!response.ok) {
    throw await ApiError.from(response);
  }

  // 202 and 204 answers have no body.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
