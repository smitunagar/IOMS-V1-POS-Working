import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable static generation for pages that use client-side features
  experimental: {
    // This helps with SSR issues
    serverComponentsExternalPackages: ['@genkit-ai/core', 'genkit'],
  },
};

export default nextConfig;
