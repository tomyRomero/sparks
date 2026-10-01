import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL ?? "http://localhost:5100";
const ACCESS_COOKIE = "sparks_access";
const REFRESH_COOKIE = "sparks_refresh";

/** Keeps the session alive across page loads and sets a per-request CSP nonce. */
export async function proxy(request: NextRequest) {
  const refreshed = await refreshSession(request);

  // Next reads the policy from the request and puts its nonce on the scripts
  // it renders; the browser enforces the copy on the response.
  const requestHeaders = new Headers(request.headers);
  const policy = isPage(request) ? contentSecurityPolicy(nonce()) : null;
  if (policy) requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (policy) response.headers.set("Content-Security-Policy", policy);
  if (refreshed === "spent") {
    // Drop the spent refresh token so this doesn't repeat on every request.
    response.cookies.delete(REFRESH_COOKIE);
  } else {
    for (const setCookie of refreshed) response.headers.append("Set-Cookie", setCookie);
  }
  return response;
}

/**
 * Rotates the session when the access cookie has expired but the refresh
 * cookie hasn't. The new cookies go on this request, so the page renders
 * signed in, and on the response. "spent" means the API refused the token.
 */
async function refreshSession(request: NextRequest): Promise<string[] | "spent"> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (request.cookies.has(ACCESS_COOKIE) || !refreshToken) return [];

  let refreshed: Response;
  try {
    refreshed = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `${REFRESH_COOKIE}=${refreshToken}`,
        ...forwardedFor(request),
      },
    });
  } catch {
    // The API is unreachable: render as a guest rather than fail the page.
    return [];
  }
  if (!refreshed.ok) return "spent";

  const setCookies = refreshed.headers.getSetCookie();
  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(";");
    const separator = pair.indexOf("=");
    request.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  return setCookies;
}

/** The address the API should rate-limit by: the last one this server saw. */
function forwardedFor(request: NextRequest): Record<string, string> {
  const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return address ? { "X-Forwarded-For": address } : {};
}

/** API calls and the live connection pass through to the API, which sets its own policy. */
function isPage(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return !pathname.startsWith("/api/") && !pathname.startsWith("/hubs/");
}

function nonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * Nonce-based scripts with 'strict-dynamic'; everything else same-origin.
 * Inline styles stay allowed for Radix and sonner. Dev needs eval for the
 * error overlay.
 */
function contentSecurityPolicy(nonce: string) {
  const development = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export const config = {
  // Pages and API calls; not Next's own assets, static files or images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|files/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
