'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import LoginForm from '@web/components/LoginForm'
import { LoginModalProvider, useLoginModal } from '@web/context/LoginModalContext'
import { RentWishlistProvider, useRentWishlist } from '@/rent/RentWishlist'

const RentLoginModal = () => {
  const { isOpen, closeLogin, refreshUser } = useLoginModal()

  if (!isOpen) return null

  return (
    <div className='vn-modal-backdrop' onClick={closeLogin}>
      <div className='vn-modal' onClick={event => event.stopPropagation()}>
        <div className='vn-modal-head'>
          <h2>Login</h2>
          <button className='vn-icon-btn' type='button' onClick={closeLogin} aria-label='Close'>
            <i className='tabler-x' />
          </button>
        </div>
        <p>Sign in with your email to keep your rent wishlist and see your bookings.</p>
        <LoginForm
          variant='modal'
          redirectTo='/rent/account'
          onSuccess={() => {
            void refreshUser()
            closeLogin()
          }}
        />
      </div>
    </div>
  )
}

const RentHeader = () => {
  const { user, openLogin, refreshUser } = useLoginModal()
  const { count } = useRentWishlist()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }

    document.addEventListener('mousedown', close)

    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const logout = async () => {
    await fetch('/api/web/auth/logout', { method: 'POST' })
    setMenuOpen(false)
    await refreshUser()
    router.push('/rent')
  }

  return (
    <header className='jr-header'>
      <Link href='/rent' className='jr-brand' aria-label="Jagu's Rent home">
        <img src='/images/brand/jagu-logo.png' alt="Jagu's Designing" />
        <span>
          <strong>Jagu&apos;s Rent</strong>
          <em>Outfit rental</em>
        </span>
      </Link>
      <nav className='jr-nav' aria-label='Rent'>
        <Link href='/rent'>Outfits</Link>
        <Link href='/rent/account'>My rentals</Link>
      </nav>
      <div className='jr-actions'>
        <div className='jr-user' ref={menuRef}>
          <button
            className='vn-icon-tip jr-user-btn'
            type='button'
            aria-label={user ? 'Account menu' : 'Login'}
            aria-expanded={menuOpen}
            data-tip={user ? user.email : 'Login'}
            onClick={() => (user ? setMenuOpen(open => !open) : openLogin())}
          >
            <i className='tabler-user' />
          </button>
          {menuOpen && user ? (
            <div className='jr-user-menu' role='menu'>
              <p>{user.email}</p>
              <Link href='/rent/account?tab=profile' onClick={() => setMenuOpen(false)}>
                Profile and address
              </Link>
              <Link href='/rent/account' onClick={() => setMenuOpen(false)}>
                My rentals
              </Link>
              <Link href='/rent/account?tab=wishlist' onClick={() => setMenuOpen(false)}>
                Wishlist
              </Link>
              <button type='button' onClick={() => void logout()}>
                Log out
              </button>
            </div>
          ) : null}
        </div>
        <Link className='vn-icon-tip vn-bag-btn' href='/rent/account?tab=wishlist' aria-label='Wishlist' data-tip='Wishlist'>
          <i className='tabler-heart' />
          <span className='vn-bag-count'>{count}</span>
        </Link>
      </div>
    </header>
  )
}

const RentFooter = () => (
  <footer className='jr-footer'>
    <img src='/images/brand/jagu-logo.png' alt="Jagu's Designing" />
    <p>Jagu&apos;s Rent — designer outfits for your dates. Separate from the shop.</p>
  </footer>
)

export const RentApp = ({ children }: { children: ReactNode }) => (
  <LoginModalProvider>
    <RentWishlistProvider>
      <div className='vn-store jr-shell'>
        <RentHeader />
        <main className='jr-main'>{children}</main>
        <RentFooter />
      </div>
      <RentLoginModal />
    </RentWishlistProvider>
  </LoginModalProvider>
)
