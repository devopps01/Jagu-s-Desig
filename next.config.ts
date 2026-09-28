import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  serverExternalPackages: ['firebase-admin'],
  images: {
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
        destination: '/en/dashboards/crm',
        permanent: false,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboards/crm',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
