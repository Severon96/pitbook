import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
