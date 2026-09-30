/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "img.clerk.com",
        },
        {
          protocol: "https",
          hostname: "images.clerk.dev",
        },
        {
          protocol: "https",
          hostname: "oaidalleapiprodscus.blob.core.windows.net",
        }
      ],
    },
  }
 ;
  
  module.exports = nextConfig;