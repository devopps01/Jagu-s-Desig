import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  serverExternalPackages: ['firebase-admin'],
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    localPatterns: [
      { pathname: '/uploads/**' },
      { pathname: '/images/**' }
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/collections/sarees',
        destination: '/collections/all',
        permanent: false
      },
      {
        source: '/collections/saree',
        destination: '/collections/all',
        permanent: false
      },
      {
        source: '/admin',
        destination: '/en/store/home-page',
        permanent: false,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/store/home-page',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
