import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['knex'],
  async redirects() {
    // Meal planning now lives on the home page
    return [{ source: '/suggestions', destination: '/', permanent: false }];
  },
  /* config options here */
};

export default nextConfig;
