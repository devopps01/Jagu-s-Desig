'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { LoginModalProvider, useLoginModal } from '@web/context/LoginModalContext'
import { WishlistProvider } from '@web/context/WishlistContext'
import EditorDeviceBoot from '@web/components/EditorDeviceBoot'
import LoginModal from '@web/components/LoginModal'
import StorefrontEngage from '@web/components/StorefrontEngage'
import StoreHeader, { CartDrawer } from '@web/components/StoreHeader'
import BrandLogo from '@/components/BrandLogo'
import { SURAT_ATELIER } from '@/libs/contact-types'
import { captureSisterCodeFromUrl } from '@web/lib/sister-referral'
import { SiteChromeProvider, useSiteChrome } from '@web/lib/site-chrome'
import { SiteThemeProvider } from '@web/lib/site-theme'
import { defaultFooterInfoLinks, defaultFooterPolicyLinks } from '@/libs/site-chrome-types'
import { useStoreContact } from '@web/lib/store-contact'
import WhatsAppFloat from '@web/components/WhatsAppFloat'
import ScrollTopButton from '@web/components/ScrollTopButton'
import StorefrontMotion from '@web/components/StorefrontMotion'
import NewsletterBlock from '@web/components/NewsletterBlock'

const AnnouncementBar = () => {
  const { announcements } = useSiteChrome()

  if (!announcements.length) return null

  const loop = [...announcements, ...announcements, ...announcements, ...announcements]

  return (
    <div className='vn-announce' role='marquee' aria-label={announcements.join('. ')}>
      <div className='vn-announce-track'>
        <div className='vn-announce-group'>
          {loop.map((item, index) => (
            <span className='vn-announce-item' key={`a-${index}`}>
              {item}
            </span>
          ))}
        </div>
        <div className='vn-announce-group' aria-hidden>
          {loop.map((item, index) => (
            <span className='vn-announce-item' key={`b-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const StoreFooter = () => {
  const { openLogin, user } = useLoginModal()
  const { phone, telHref, whatsappHref, suratTitle, suratAddress } = useStoreContact()
  const { chrome } = useSiteChrome()
  const addressLines = (suratAddress || SURAT_ATELIER.full)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
  const policySource =
    Array.isArray(chrome.footerPolicyLinks) && chrome.footerPolicyLinks.length
      ? chrome.footerPolicyLinks
      : defaultFooterPolicyLinks()
  const infoSource =
    Array.isArray(chrome.footerInfoLinks) && chrome.footerInfoLinks.length
      ? chrome.footerInfoLinks
      : defaultFooterInfoLinks()
  const policyLinks = policySource.filter(link => link.enabled !== false)
  const infoLinks = infoSource.filter(link => link.enabled !== false)

  const renderFooterLink = (link: { id: string; label: string; href: string }) => {
    if (link.href === '__account__') {
      if (user) {
        return (
          <Link key={link.id} href='/account'>
            {link.label || 'My account'}
          </Link>
        )
      }

      return (
        <button
          key={link.id}
          className='vn-text-link'
          type='button'
          onClick={openLogin}
          style={{ color: '#f3c2d6', padding: 0 }}
        >
          Login
        </button>
      )
    }

    return (
      <Link key={link.id} href={link.href || '/'}>
        {link.label}
      </Link>
    )
  }

  return (
    <footer className='vn-footer'>
      <NewsletterBlock />
      <div className='vn-footer-body'>
        <div className='vn-footer-grid'>
          <div>
            <BrandLogo height={120} />
            <p>{chrome.footerTagline}</p>
          </div>
          <div>
            <h4>{chrome.footerPolicyTitle}</h4>
            {policyLinks.map(renderFooterLink)}
          </div>
          <div>
            <h4>{chrome.footerInfoTitle}</h4>
            {infoLinks.map(renderFooterLink)}
          </div>
          <div>
            <h4>{chrome.footerAtelierTitle}</h4>
            <p>{suratTitle || SURAT_ATELIER.name}</p>
            {addressLines.length ? addressLines.map(line => <p key={line}>{line}</p>) : null}
            <a href={telHref}>Call {phone}</a>
            <a href={whatsappHref(chrome.floatMessage)} target='_blank' rel='noreferrer'>
              WhatsApp {phone}
            </a>
          </div>
        </div>
        <p className='vn-copy'>{chrome.footerCopyright}</p>
      </div>
      <div className='vn-paybar'>
        <p>Jagu&apos;s Designing</p>
        <div className='vn-pay-icons' aria-label='Accepted payments'>
          <svg viewBox='0 0 64 32' role='img' aria-label='Visa'>
            <rect width='64' height='32' rx='4' fill='#1434CB' />
            <text x='32' y='21' textAnchor='middle' fill='#fff' fontFamily='Arial, Helvetica, sans-serif' fontStyle='italic' fontWeight='800' fontSize='16' letterSpacing='1'>
              VISA
            </text>
          </svg>
          <svg viewBox='0 0 48 32' role='img' aria-label='Mastercard'>
            <rect width='48' height='32' rx='4' fill='#fff' stroke='#eadfe4' />
            <circle cx='19' cy='16' r='8' fill='#EB001B' />
            <circle cx='29' cy='16' r='8' fill='#F79E1B' />
            <path d='M24 10.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z' fill='#FF5F00' />
          </svg>
          <svg viewBox='0 0 72 32' role='img' aria-label='RuPay'>
            <rect width='72' height='32' rx='4' fill='#fff' stroke='#eadfe4' />
            <text x='8' y='21' fill='#00A651' fontFamily='Arial, Helvetica, sans-serif' fontWeight='800' fontSize='15'>
              Ru
            </text>
            <text x='30' y='21' fill='#F37021' fontFamily='Arial, Helvetica, sans-serif' fontWeight='800' fontSize='15'>
              Pay
            </text>
          </svg>
          <svg viewBox='0 0 64 32' role='img' aria-label='UPI'>
            <rect width='64' height='32' rx='4' fill='#fff' stroke='#eadfe4' />
            <path d='M8 22L16 9h3.2L11.2 22H8z' fill='#097939' />
            <path d='M14 22l8-13h3.2L17.2 22H14z' fill='#ED752E' />
            <path d='M20 22l8-13h3.2L23.2 22H20z' fill='#747474' />
            <text x='34' y='21' fill='#111' fontFamily='Arial, Helvetica, sans-serif' fontWeight='800' fontSize='13'>
              UPI
            </text>
          </svg>
        </div>
      </div>
    </footer>
  )
}

const StorefrontShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

  useEffect(() => {
    captureSisterCodeFromUrl()
  }, [])

  useEffect(() => {
    const chrome = document.querySelector('.vn-chrome')
    const header = document.querySelector('.vn-header')

    if (!(chrome instanceof HTMLElement) || !(header instanceof HTMLElement)) return

    const stackHeight = () => {
      const announce = chrome.querySelector('.vn-announce')
      const announceHeight = announce instanceof HTMLElement ? announce.getBoundingClientRect().height : 0

      return Math.max(88, Math.ceil(announceHeight + header.getBoundingClientRect().height))
    }

    let lastHeight = 0
    let timer = 0

    const measure = () => {
      if (document.documentElement.classList.contains('vn-is-scrolled')) return

      const height = stackHeight()

      if (height === lastHeight) return

      lastHeight = height
      document.documentElement.style.setProperty('--vn-chrome-height', `${height}px`)
      document.documentElement.style.setProperty('--vn-chrome-tall', `${height}px`)
      document.documentElement.style.setProperty('--vn-chrome-short', `${height}px`)
    }

    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(measure, 160)
    }

    measure()
    const observer = new ResizeObserver(() => schedule())
    observer.observe(chrome)
    observer.observe(header)
    window.addEventListener('vn-chrome-remeasure', measure)

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('vn-chrome-remeasure', measure)
    }
  }, [pathname])

  return (
    <div className='vn-store'>
      <EditorDeviceBoot />
      <div className='vn-store-page'>
        <div className='vn-chrome-spacer' aria-hidden='true' />
        <div className='vn-chrome'>
          <AnnouncementBar />
          <StoreHeader />
        </div>
        <main>
          <div className='vn-scroll-sentinel' aria-hidden='true' />
          {children}
        </main>
        <StoreFooter />
      </div>
      <WhatsAppFloat />
      <ScrollTopButton />
      <LoginModal />
      <StorefrontEngage />
      <StorefrontMotion />
      <CartDrawer />
    </div>
  )
}

const StorefrontLayout = ({ children }: { children: React.ReactNode }) => (
  <LoginModalProvider>
    <WishlistProvider>
      <SiteThemeProvider>
        <SiteChromeProvider>
          <StorefrontShell>{children}</StorefrontShell>
        </SiteChromeProvider>
      </SiteThemeProvider>
    </WishlistProvider>
  </LoginModalProvider>
)

export default StorefrontLayout
