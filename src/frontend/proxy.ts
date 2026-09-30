import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL ?? "http://localhost:5100";
const ACCESS_COOKIE = "sparks_access";
const REFRESH_COOKIE = "sparks_refresh";

/**
 * Keeps sessions alive across page loads. The access cookie expires with its
 * token (30 minutes); when it's gone but the refresh cookie remains, the
 * session is rotated here, before anything renders. The new cookies go to
 * the browser, and into this request, so the page renders signed in.
 */
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (request.cookies.has(ACCESS_COOKIE) || !refreshToken) {
    return NextResponse.next();
  }

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
    return NextResponse.next();
  }

  if (!refreshed.ok) {
    // The refresh token is spent or revoked; drop it so this doesn't repeat.
    const response = NextResponse.next();
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const setCookies = refreshed.headers.getSetCookie();
  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(";");
    const separator = pair.indexOf("=");
    request.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }

  const response = NextResponse.next({ request: { headers: request.headers } });
  for (const setCookie of setCookies) {
    response.headers.append("Set-Cookie", setCookie);
  }
  return response;
}

/** The address the API should rate-limit by: the last one this server saw. */
function forwardedFor(request: NextRequest): Record<string, string> {
  const address = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return address ? { "X-Forwarded-For": address } : {};
}

export const config = {
  // Pages and API calls; not Next's own assets, static files or images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|files/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
