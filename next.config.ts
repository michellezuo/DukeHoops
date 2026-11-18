import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using route-level `revalidate` (ISR) rather than Cache Components for now;
  // the dataset changes at most daily via the ingestion workflow.
  // The JSON backend reads data/ at runtime; make sure Vercel bundles it.
  outputFileTracingIncludes: { "/**": ["./data/**/*.json"] },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "a.espncdn.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
