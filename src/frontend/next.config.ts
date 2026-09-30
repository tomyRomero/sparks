import type { NextConfig } from "next";

/**
 * Where the Sparks API runs. The browser never calls it directly for data:
 * /api/v1 and /files are proxied through this app, so requests stay
 * same-origin and the sign-in cookies travel with them.
 */
const apiUrl = process.env.API_URL ?? "http://localhost:5100";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
      { source: "/files/:path*", destination: `${apiUrl}/files/:path*` },
    ];
  },
  images: {
    // Avatars and post images are served by the API under /files.
    localPatterns: [{ pathname: "/files/**" }],
  },
};

export default nextConfig;
