import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Prevent browsers / installed PWAs from caching HTML pages
        source: "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
