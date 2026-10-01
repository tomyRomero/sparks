export const apiUrl = process.env.API_URL ?? "http://localhost:5100";

/** Where this app is reached, for the absolute links that link previews need. */
export const siteUrl = process.env.SITE_URL ?? "http://localhost:3100";

// Set by the API (AuthCookies.cs).
export const ACCESS_COOKIE = "sparks_access";
export const REFRESH_COOKIE = "sparks_refresh";
