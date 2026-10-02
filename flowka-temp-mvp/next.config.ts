import type { NextConfig } from 'next';
const config: NextConfig = {
  images: {
    qualities: [75, 90],
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 512],
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920, 2048, 3840],
    remotePatterns: [{ protocol: 'https', hostname: 'api.crm.nazdar.kz', pathname: '/media/**' }],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
