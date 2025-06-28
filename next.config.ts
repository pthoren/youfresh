import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['knex'],
  }
  /* config options here */
};

export default nextConfig;
