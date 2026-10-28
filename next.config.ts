import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The container image builds a self-contained server bundle (.next/standalone).
  // Gated so the current Netlify build keeps its existing output shape until the
  // hostname moves off Netlify.
  output: process.env.BUILD_TARGET === "container" ? "standalone" : undefined,
  experimental: {
    // Set by the security upgrade handoff so the next affected release is
    // flagged the same way instead of failing the build silently.
    agentUpgrade: "security",
  },
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
