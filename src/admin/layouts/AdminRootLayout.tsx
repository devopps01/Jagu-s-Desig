import { headers } from 'next/headers'

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

import 'react-perfect-scrollbar/dist/css/styles.css'

import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

import TranslationWrapper from '@/hocs/TranslationWrapper'

import { i18n } from '@configs/i18n'

import { getSystemMode } from '@core/utils/serverHelpers'

import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const adminMetadata = {
  title: 'Jagu Design Admin',
  description: 'Admin dashboard for the Jagu Design storefront.',
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

const AdminRootLayout = async (props: ChildrenType & { params: Promise<{ lang: string }> }) => {
  const params = await props.params
  const { children } = props

  const lang: Locale = i18n.locales.includes(params.lang as Locale) ? (params.lang as Locale) : i18n.defaultLocale

  const headersList = await headers()
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[lang]

  return (
    <TranslationWrapper headersList={headersList} lang={lang}>
      <html id='__next' lang={lang} dir={direction} suppressHydrationWarning>
        <body className='flex is-full min-bs-full flex-auto flex-col'>
          <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
          {children}
        </body>
      </html>
    </TranslationWrapper>
  )
}

export default AdminRootLayout
