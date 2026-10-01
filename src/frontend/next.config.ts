import type { NextConfig } from "next";

/**
 * Where the Sparks API runs. The browser never calls it directly: /api/v1,
 * /files and the live connection at /hubs are proxied through this app, so
 * requests stay same-origin and the sign-in cookies travel with them.
 */
const apiUrl = process.env.API_URL ?? "http://localhost:5100";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Everything this app serves; the API sets its own on what it serves.
        // The Content Security Policy needs a nonce per page, so it's set in
        // proxy.ts.
        source: "/((?!api/v1/|files/|hubs/).*)",
        headers: [
          // Never guess a content type, so nothing can be run as a script
          // that wasn't sent as one.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // For browsers without CSP frame-ancestors: no framing at all.
          { key: "X-Frame-Options", value: "DENY" },
          // Other sites see where a visitor came from, never the full path.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here uses the camera, microphone or location.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
      { source: "/files/:path*", destination: `${apiUrl}/files/:path*` },
      { source: "/hubs/:path*", destination: `${apiUrl}/hubs/:path*` },
    ];
  },
  images: {
    // Avatars and post images are served by the API under /files.
    localPatterns: [{ pathname: "/files/**" }],
  },
};

export default nextConfig;
