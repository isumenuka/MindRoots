/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'mindroots.web.app', 'mindroots.firebaseapp.com'],
    },
  },
  // Required for @react-pdf/renderer in Next.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
  turbopack: {},
}

module.exports = nextConfig

