import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-expect-error - eslint is a valid config option
  eslint: {
    ignoreDuringBuilds: true,
  },
  // @ts-expect-error - typescript is a valid config option
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
