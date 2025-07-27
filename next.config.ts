import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/1inch/:path*',
        destination: 'http://localhost:3001/mock-1inch-api/:path*',
      },
    ];
  },
};

export default nextConfig;
