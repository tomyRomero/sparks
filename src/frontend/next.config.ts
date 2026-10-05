import type { NextConfig } from "next";
import { apiUrl } from "./lib/api/config";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // The API sets its own headers; the CSP is per request in proxy.ts.
        source: "/((?!api/v1/|files/|hubs/).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // For browsers without CSP frame-ancestors: no framing at all.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // The browser only talks to this app, so requests stay same-origin.
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
