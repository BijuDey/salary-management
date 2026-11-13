import type { NextConfig } from 'next';

/**
 * The browser only ever talks to this app's own origin; /api/* is proxied to the API server.
 * That keeps the session cookie first-party (httpOnly, SameSite=Lax) and removes the need for CORS.
 *
 * A production build without API_URL would silently proxy to localhost, so it fails instead.
 */
function apiUrl(): string {
  const url = process.env.API_URL;
  if (url) return url.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Set API_URL to the API server origin, e.g. https://api.example.com');
  }
  return 'http://localhost:4000';
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl()}/api/:path*` }];
  },
};

export default nextConfig;
