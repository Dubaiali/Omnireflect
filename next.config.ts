import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  },

  // HTTPS in Produktion erzwingen
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: 'https://',
  }),

  // Environment Variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental Features
  experimental: {
    serverComponentsExternalPackages: ['openai']
  }
}

export default nextConfig
