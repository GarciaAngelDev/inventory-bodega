import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel + ESLint 9 legacy path can throw "Unexpected top-level property files"
  // when merging extended configs; skipping lint during build avoids a broken deploy.
  // Run `npm run lint` locally or in CI to keep checking code.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
