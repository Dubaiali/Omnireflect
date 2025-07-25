/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false
  },
  // CSS-Optimierungen für konsistentes Design zwischen Dev und Production
  optimizeCss: true,
  // Verhindere CSS-Minifizierung für bessere Debugging-Möglichkeiten
  swcMinify: false,
  // Stelle sicher, dass Tailwind CSS korrekt geladen wird
  webpack: (config, { isServer, dev }) => {
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
    
    // CSS-Optimierungen für konsistentes Design
    if (!dev) {
      // Stelle sicher, dass Tailwind CSS korrekt verarbeitet wird
      config.module.rules.push({
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      })
    }
    
    return config
  }
}

module.exports = nextConfig 