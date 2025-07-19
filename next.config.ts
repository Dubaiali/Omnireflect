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
            value: 'SAMEORIGIN'
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
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  },

  // Environment Variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Server External Packages
  serverExternalPackages: ['openai'],

  // Webpack configuration for @react-pdf/renderer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
        os: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        constants: false,
        querystring: false,
        punycode: false,
        domain: false,
        dns: false,
        net: false,
        tls: false,
        child_process: false,
        cluster: false,
        module: false,
        vm: false,
        tty: false,
        readline: false,
        repl: false,
        string_decoder: false,
        timers: false,
        events: false,
        _stream_duplex: false,
        _stream_passthrough: false,
        _stream_readable: false,
        _stream_transform: false,
        _stream_writable: false,
      }
    }
    return config
  }
}

export default nextConfig
