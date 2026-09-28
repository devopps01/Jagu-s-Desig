import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { CartProvider } from '@web/context/CartContext'
import StorefrontLayout from '@web/layouts/StorefrontLayout'

import '@assets/iconify-icons/generated-icons.css'
import '@web/styles/storefront.css'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-vn-serif'
})

const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-vn-sans'
})

export const metadata = {
  title: "Jagu's Designing — Chaniya Choli | Tradition Meets Fashion",
  description: 'Designer chaniya choli collections for wedding, engagement, Navratri, party and latest trends.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/images/brand/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/brand/icon-192.png', type: 'image/png', sizes: '192x192' }
    ],
    apple: [{ url: '/images/brand/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.ico'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#fff4f8'
}

const WebRootLayout = ({ children }: { children: ReactNode }) => (
  <html lang='en' className={`${serif.variable} ${sans.variable}`}>
    <body>
      <CartProvider>
        <StorefrontLayout>{children}</StorefrontLayout>
      </CartProvider>
    </body>
  </html>
)

export default WebRootLayout
