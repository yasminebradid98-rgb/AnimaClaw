const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' for VPS/Docker, omit on Vercel (Vercel manages its own output)
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),

  // On Vercel: proxy all /api/* to VPS brain via Cloudflare Tunnel
  // Uses `beforeFiles` so the rewrite fires BEFORE Next.js route matching,
  // overriding the local API route files (which need SQLite — unavailable on Vercel).
  ...(process.env.VERCEL && process.env.VPS_API_URL ? {
    async rewrites() {
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: `${process.env.VPS_API_URL}/api/:path*`,
          },
        ],
      }
    },
  } : {}),

  // Don't bundle native modules — let Node.js require them at runtime
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingExcludes: {
    '/*': [
      './.data/**/*',
      './.pnpm-store/**/*',
      './docs/**/*.png',
      './public/mc.png',
      './public/mc-logo.png',
      './tests/**/*',
      './.github/**/*',
      './wiki/**/*',
    ],
  },
  turbopack: {},
  // Transpile ESM-only packages so they resolve correctly in all environments
  transpilePackages: ['react-markdown', 'remark-gfm'],
  
  // Security headers
  // Content-Security-Policy is set in src/proxy.ts with a per-request nonce.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(process.env.MC_ENABLE_HSTS === '1' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
          ] : []),
        ],
      },
    ];
  },
  
};

module.exports = withNextIntl(nextConfig);
