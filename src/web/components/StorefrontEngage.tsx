'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import LoginForm from '@web/components/LoginForm'
import { useLoginModal } from '@web/context/LoginModalContext'
import { registerWebPush, requestWebPush } from '@web/lib/firebase-client'

const LOGIN_SHOWN = 'jagu-login-shown'
const LAST_PATH = 'jagu-last-path'
const PAGE_VIEWS = 'jagu-page-views'
const OFFER_DONE = 'jagu-offer-dismissed'
const PUSH_ASKED = 'jagu-push-asked'

type FeaturedOffer = { code: string; label: string; note: string }

const StorefrontEngage = () => {
  const pathname = usePathname()
  const { user, ready, isOpen, openLogin, closeLogin, refreshUser } = useLoginModal()
  const [offerOpen, setOfferOpen] = useState(false)
  const [pushOpen, setPushOpen] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [offer, setOffer] = useState<FeaturedOffer | null>(null)

  const dismissOffer = () => {
    window.localStorage.setItem(OFFER_DONE, '1')
    setOfferOpen(false)
  }

  useEffect(() => {
    fetch('/api/web/offers/featured')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json?.label) setOffer(json)
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    if (!ready || user || pathname === '/login') return
    if (window.sessionStorage.getItem(LOGIN_SHOWN) === '1') return

    window.sessionStorage.setItem(LOGIN_SHOWN, '1')
    queueMicrotask(() => openLogin())
  }, [openLogin, pathname, ready, user])

  useEffect(() => {
    if (!ready || user || pathname === '/login') return

    const last = window.sessionStorage.getItem(LAST_PATH)

    if (last === pathname) return

    window.sessionStorage.setItem(LAST_PATH, pathname)
    const count = Number(window.sessionStorage.getItem(PAGE_VIEWS) || '0') + 1

    window.sessionStorage.setItem(PAGE_VIEWS, String(count))

    if (count >= 3 && window.localStorage.getItem(OFFER_DONE) !== '1' && !isOpen) {
      setOfferOpen(true)
    }
  }, [isOpen, pathname, ready, user])

  useEffect(() => {
    if (!ready || user || isOpen) return
    if (window.localStorage.getItem(OFFER_DONE) === '1') return

    const count = Number(window.sessionStorage.getItem(PAGE_VIEWS) || '0')

    if (count >= 3) setOfferOpen(true)
  }, [isOpen, ready, user])

  useEffect(() => {
    if (!ready || isOpen || offerOpen) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      void registerWebPush()
      return
    }

    if (Notification.permission === 'denied' || window.localStorage.getItem(PUSH_ASKED) === '1') return

    const timer = window.setTimeout(() => setPushOpen(true), 800)

    return () => window.clearTimeout(timer)
  }, [isOpen, offerOpen, ready, user])

  const allowPush = async () => {
    setPushBusy(true)
    window.localStorage.setItem(PUSH_ASKED, '1')
    await requestWebPush()
    setPushBusy(false)
    setPushOpen(false)
  }

  const laterPush = () => {
    window.localStorage.setItem(PUSH_ASKED, '1')
    setPushOpen(false)
  }

  return (
    <>
      {offerOpen && !isOpen && !user ? (
        <div className='vn-modal-backdrop' onClick={dismissOffer}>
          <div className='vn-modal is-offer' onClick={event => event.stopPropagation()} role='dialog' aria-modal='true'>
            <div className='vn-modal-head'>
              <h2>Member offer</h2>
              <button className='vn-icon-btn' type='button' onClick={dismissOffer} aria-label='Close'>
                <i className='tabler-x' />
              </button>
            </div>
            {offer?.label ? <p className='vn-offer-chip'>{offer.code ? `${offer.code} · ${offer.label}` : offer.label}</p> : null}
            <p>{offer?.note || 'Login with your email to keep this offer on checkout.'}</p>
            <LoginForm
              variant='modal'
              onSuccess={() => {
                window.localStorage.setItem(OFFER_DONE, '1')
                setOfferOpen(false)
                closeLogin()
                void refreshUser()
              }}
            />
          </div>
        </div>
      ) : null}

      {pushOpen && !isOpen && !offerOpen ? (
        <div className='vn-modal-backdrop' onClick={laterPush}>
          <div className='vn-modal is-push' onClick={event => event.stopPropagation()} role='dialog' aria-modal='true'>
            <div className='vn-modal-head'>
              <h2>Stay updated</h2>
              <button className='vn-icon-btn' type='button' onClick={laterPush} aria-label='Close'>
                <i className='tabler-x' />
              </button>
            </div>
            <p>Allow notifications for order updates, offers and new chaniya choli drops. Each device is saved in admin for Firebase campaigns.</p>
            <div className='vn-account-actions'>
              <button className='vn-btn vn-btn-solid' type='button' disabled={pushBusy} onClick={() => void allowPush()}>
                {pushBusy ? 'Saving…' : 'Allow notifications'}
              </button>
              <button className='vn-btn vn-btn-outline' type='button' onClick={laterPush}>
                Later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default StorefrontEngage
