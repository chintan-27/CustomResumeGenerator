/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase proxy timeout for long-running LLM calls (default is ~30s)
  httpAgentOptions: {
    keepAlive: true,
  },
  experimental: {
    proxyTimeout: 120_000, // 2 minutes
  },
  rewrites: async () => {
    return [
      {
        source: '/python/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/:path*'
            : '/api/',
      },
    ]
  },
}

module.exports = nextConfig
