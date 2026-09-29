'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { announcementSlides } from '@web/data/catalog'
import { LoginModalProvider, useLoginModal } from '@web/context/LoginModalContext'
import { WishlistProvider } from '@web/context/WishlistContext'
import LoginModal from '@web/components/LoginModal'
import StorefrontEngage from '@web/components/StorefrontEngage'
import StoreHeader, { CartDrawer } from '@web/components/StoreHeader'
import BrandLogo from '@/components/BrandLogo'
import { SURAT_ATELIER } from '@/libs/contact-types'
import { captureSisterCodeFromUrl } from '@web/lib/sister-referral'
import { useStoreContact } from '@web/lib/store-contact'
import WhatsAppFloat from '@web/components/WhatsAppFloat'
import ScrollTopButton from '@web/components/ScrollTopButton'
import StorefrontMotion from '@web/components/StorefrontMotion'
import NewsletterBlock from '@web/components/NewsletterBlock'

const AnnouncementBar = () => {
  const loop = [...announcementSlides, ...announcementSlides, ...announcementSlides, ...announcementSlides]

  return (
    <div className='vn-announce' role='marquee' aria-label={announcementSlides.join('. ')}>
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
  const { phone, telHref, whatsappHref } = useStoreContact()

  return (
    <footer className='vn-footer'>
      <NewsletterBlock />
      <div className='vn-footer-body'>
        <div className='vn-footer-grid'>
          <div>
            <BrandLogo height={120} />
            <p>Tradition meets fashion — designer chaniya choli collections.</p>
          </div>
          <div>
            <h4>Policy & Inquiry</h4>
            <Link href='/returns'>Return & Exchange Policy</Link>
            <Link href='/shipping'>Shipping Policy</Link>
            <Link href='/terms'>Terms and Conditions</Link>
            <Link href='/privacy'>Privacy Policy</Link>
            <Link href='/contact'>Contact Us</Link>
          </div>
          <div>
            <h4>Information</h4>
            <Link href='/about'>About us</Link>
            <Link href='/video'>Video Shopping</Link>
            <Link href='/track-order'>Track Order</Link>
            {user ? (
              <Link href='/account'>My account</Link>
            ) : (
              <button className='vn-text-link' type='button' onClick={openLogin} style={{ color: '#f3c2d6', padding: 0 }}>
                Login
              </button>
            )}
          </div>
          <div>
            <h4>Atelier</h4>
            <p>{SURAT_ATELIER.name}</p>
            <p>{SURAT_ATELIER.line1}</p>
            <p>{SURAT_ATELIER.line2}</p>
            <a href={telHref}>Call {phone}</a>
            <a href={whatsappHref('Hello Jagu’s Designing, I would like to enquire.')} target='_blank' rel='noreferrer'>
              WhatsApp {phone}
            </a>
          </div>
        </div>
        <p className='vn-copy'>Copyright 2026 © Jagu&apos;s Designing. All rights reserved.</p>
      </div>
      <div className='vn-paybar'>
        <p>Jagu&apos;s Designing</p>
        <div>
          <span>We accept</span>
          <em>Visa</em>
          <em>Mastercard</em>
          <em>RuPay</em>
          <em>UPI</em>
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

    const measure = () => {
      const height = stackHeight()
      document.documentElement.style.setProperty('--vn-chrome-height', `${height}px`)
      document.documentElement.style.setProperty('--vn-chrome-tall', `${height}px`)
      document.documentElement.style.setProperty('--vn-chrome-short', `${height}px`)
    }

    measure()
    const observer = new ResizeObserver(() => measure())
    observer.observe(chrome)
    observer.observe(header)
    window.addEventListener('vn-chrome-remeasure', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('vn-chrome-remeasure', measure)
    }
  }, [pathname])

  return (
    <div className='vn-store'>
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
      <StorefrontShell>{children}</StorefrontShell>
    </WishlistProvider>
  </LoginModalProvider>
)

export default StorefrontLayout
