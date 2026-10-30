import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

import { RentApp } from '@/rent/RentChrome'

import '@assets/iconify-icons/generated-icons.css'
import '@web/styles/storefront.css'
import '@/rent/rent.css'

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
  title: "Jagu's Rent — Outfit rental",
  description: 'Rent designer outfits from Jagu’s Rent. Separate from the shop.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/images/brand/icon-32.png', type: 'image/png', sizes: '32x32' }
    ]
  }
}

const RentRootLayout = ({ children }: { children: ReactNode }) => (
  <html lang='en' className={`${serif.variable} ${sans.variable}`}>
    <body>
      <RentApp>{children}</RentApp>
    </body>
  </html>
)

export default RentRootLayout
