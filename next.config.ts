import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dining-area-setup',
        destination: '/apps/pos/table-management',
        permanent: true,
      },
      // Keep backward compatibility for existing table-management route
      {
        source: '/table-management',
        destination: '/apps/pos/table-management',
        permanent: true,
      },
    ];
  },
}

export default nextConfig 