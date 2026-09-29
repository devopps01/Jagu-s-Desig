'use client'

import Link from 'next/link'
import { withoutSareeWord } from '@/libs/public-label'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@web/context/CartContext'
import { useWishlist } from '@web/context/WishlistContext'
import { useLoginModal } from '@web/context/LoginModalContext'
import HeaderSearch from '@web/components/HeaderSearch'
import BrandLogo from '@/components/BrandLogo'
import CartLineItem from '@web/components/CartLineItem'
import CartTotals from '@web/components/CartTotals'
import { useStoreContact } from '@web/lib/store-contact'

type HeaderCategory = {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

export const CartDrawer = () => {
  const router = useRouter()
  const { isOpen, closeCart, lines, removeItem, setQty, count, subtotal } = useCart()

  if (!isOpen) return null

  const goToCheckout = () => {
    router.push('/checkout')
    closeCart()
  }

  return (
    <>
      <button className='vn-drawer-backdrop' type='button' aria-label='Close cart' onClick={closeCart} />
      <aside className='vn-drawer' aria-label='Shopping bag'>
        <div className='vn-drawer-head'>
          <div>
            <p className='vn-drawer-kicker'>Shopping bag</p>
            <h2>
              {count ? (
                <>
                  <span className='vn-bag-qty'>{count}</span> {count === 1 ? 'item' : 'items'}
                </>
              ) : (
                'Your bag'
              )}
            </h2>
          </div>
          <button className='vn-icon-btn' type='button' onClick={closeCart} aria-label='Close cart'>
            <i className='tabler-x' />
          </button>
        </div>
        {lines.length === 0 ? (
          <div className='vn-drawer-empty'>
            <i className='tabler-shopping-bag' />
            <p>Your bag is empty</p>
            <span>Add a piece you love and it will show up here.</span>
            <Link className='vn-btn vn-btn-solid' href='/collections/all' onClick={closeCart}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className='vn-drawer-body'>
              {lines.map(line => (
                <CartLineItem
                  key={line.id}
                  line={line}
                  onRemove={() => removeItem(line.id)}
                  onQty={qty => setQty(line.id, qty)}
                  onNavigate={closeCart}
                />
              ))}
            </div>
            <div className='vn-drawer-foot'>
              <CartTotals count={count} subtotal={subtotal} onCheckout={goToCheckout} onShop={closeCart} checkoutAsButton />
              <Link className='vn-cart-link' href='/cart' onClick={closeCart}>
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

const StoreHeader = () => {
  const { count, openCart } = useCart()
  const { count: wishCount } = useWishlist()
  const { user, openLogin } = useLoginModal()
  const [categories, setCategories] = useState<HeaderCategory[]>([])
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState('')
  const { phone, telHref, whatsappHref } = useStoreContact()

  useEffect(() => {
    fetch('/api/web/categories')
      .then(res => res.json())
      .then(json => {
        setCategories(Array.isArray(json) ? json : [])
        window.setTimeout(() => window.dispatchEvent(new Event('vn-chrome-remeasure')), 50)
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let compact = false
    let frame = 0
    let lockedUntil = 0

    const apply = (next: boolean) => {
      if (next === compact) return
      if (Date.now() < lockedUntil) return

      compact = next
      lockedUntil = Date.now() + 280
      setScrolled(next)
      document.documentElement.classList.toggle('vn-is-scrolled', next)
    }

    const read = () => {
      if (Date.now() < lockedUntil) return
      const y = window.scrollY || document.documentElement.scrollTop || 0
      if (!compact && y > 80) apply(true)
      else if (compact && y < 20) apply(false)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.classList.remove('vn-is-scrolled')
    }
  }, [])

  const publicLabel = (name: string) => {
    const next = withoutSareeWord(name)

    return /^look$/i.test(next) && /saree/i.test(name) ? 'Shop' : next
  }

  const publicHref = (slug: string) => (slug === 'sarees' || slug === 'saree' ? '/collections/all' : `/collections/${slug}`)

  const navIcon = (label: string) => {
    const key = label.toLowerCase()

    if (key.includes('wedding')) return 'tabler-diamond'
    if (key.includes('engagement')) return 'tabler-heart-handshake'
    if (key.includes('navratri') || key.includes('garba')) return 'tabler-sparkles'
    if (key.includes('trend') || key.includes('latest') || key.includes('new')) return 'tabler-trending-up'
    if (key.includes('party') || key.includes('cocktail')) return 'tabler-glass'
    if (key.includes('haldi') || key.includes('mehendi') || key.includes('festive')) return 'tabler-flower'

    return 'tabler-hanger'
  }

  const menu = categories.map(item => ({
    label: publicLabel(item.name),
    href: publicHref(item.slug),
    icon: navIcon(publicLabel(item.name)),
    children: item.children || []
  }))

  const navLinks = (
    <>
      {menu.map(item => (
        <div className='vn-nav-item' key={item.href}>
          <Link href={item.href}>{item.label}</Link>
          {item.children.length ? (
            <div className='vn-drop'>
              {item.children.map(child => (
                <Link key={child.id} href={publicHref(child.slug)}>
                  {publicLabel(child.name)}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
      <div className='vn-nav-item'>
        <Link href='/contact'>Contact</Link>
      </div>
    </>
  )

  return (
    <>
    <header className={scrolled ? 'vn-header is-scrolled' : 'vn-header'}>
      <div className='vn-header-row'>
        <div className='vn-header-search-bar'>
          <HeaderSearch variant='bar' />
        </div>
        <button className='vn-menu-btn' type='button' aria-label='Open menu' aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <i className='tabler-menu-2' />
        </button>
        <Link className='vn-logo' href='/'>
          <BrandLogo height={108} />
        </Link>
        <nav className='vn-nav vn-nav-inline' aria-label='Main'>
          {navLinks}
        </nav>
        <div className='vn-actions'>
          <a className='vn-icon-tip' href={telHref} aria-label={`Call ${phone}`} data-tip={phone}>
            <i className='tabler-phone' />
          </a>
          <a
            className='vn-icon-tip'
            href={whatsappHref('Hello Jagu’s Designing, I would like to enquire.')}
            target='_blank'
            rel='noreferrer'
            aria-label={`WhatsApp ${phone}`}
            data-tip='WhatsApp'
          >
            <i className='tabler-brand-whatsapp' />
          </a>
          <div className='vn-header-search-icon'>
            <HeaderSearch variant='icon' />
          </div>
          {user ? (
            <Link className='vn-icon-tip vn-top-only' href='/account' aria-label='Account' data-tip={user.email}>
              <i className='tabler-user' />
            </Link>
          ) : (
            <button className='vn-icon-tip vn-top-only' type='button' onClick={openLogin} aria-label='Login' data-tip='Login'>
              <i className='tabler-user' />
            </button>
          )}
          <Link className='vn-icon-tip vn-bag-btn vn-top-only' href='/account?tab=wishlist' aria-label='Wishlist' data-tip='Wishlist'>
            <i className='tabler-heart' />
            <span className='vn-bag-count'>{wishCount}</span>
          </Link>
          <button className='vn-icon-tip vn-bag-btn vn-top-only' type='button' onClick={openCart} aria-label='Cart' data-tip='Cart'>
            <i className='tabler-shopping-bag' />
            <span className='vn-bag-count'>{count}</span>
          </button>
        </div>
      </div>
      <nav className='vn-nav vn-nav-below' aria-label='Main categories'>
        {navLinks}
      </nav>
      {menuOpen ? (
        <>
          <button className='vn-drawer-backdrop' type='button' aria-label='Close menu' onClick={() => setMenuOpen(false)} />
          <aside className='vn-side-menu' aria-label='Menu'>
            <div className='vn-drawer-head'>
              <div>
                <p className='vn-drawer-kicker'>Menu</p>
                <h2>Shop</h2>
              </div>
              <button className='vn-icon-btn' type='button' onClick={() => setMenuOpen(false)} aria-label='Close menu'>
                <i className='tabler-x' />
              </button>
            </div>
            <nav className='vn-side-nav'>
              {menu.map(item => (
                <div className={openGroup === item.href ? 'is-open' : ''} key={item.href}>
                  <div className='vn-side-row'>
                    <Link href={item.href} onClick={() => setMenuOpen(false)}>
                      <i className={item.icon} aria-hidden='true' />
                      <span>{item.label}</span>
                    </Link>
                    {item.children.length ? (
                      <button
                        type='button'
                        aria-label={`${openGroup === item.href ? 'Hide' : 'Show'} ${item.label}`}
                        onClick={() => setOpenGroup(current => (current === item.href ? '' : item.href))}
                      >
                        <i className='tabler-chevron-down' />
                      </button>
                    ) : null}
                  </div>
                  {item.children.length && openGroup === item.href ? (
                    <div className='vn-side-drop'>
                      {item.children.map(child => (
                        <Link key={child.id} href={publicHref(child.slug)} onClick={() => setMenuOpen(false)}>
                          {publicLabel(child.name)}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className='vn-side-row'>
                <Link href='/contact' onClick={() => setMenuOpen(false)}>
                  <i className='tabler-mail' aria-hidden='true' />
                  <span>Contact</span>
                </Link>
              </div>
            </nav>
          </aside>
        </>
      ) : null}
    </header>
    <nav className='vn-bottom-bar' aria-label='Account, wishlist and cart'>
      {user ? (
        <Link href='/account'>
          <i className='tabler-user' />
          <span>Account</span>
        </Link>
      ) : (
        <button type='button' onClick={openLogin}>
          <i className='tabler-user' />
          <span>Account</span>
        </button>
      )}
      <Link href='/account?tab=wishlist'>
        <i className='tabler-heart' />
        <span>Wishlist</span>
        <em>{wishCount}</em>
      </Link>
      <button type='button' onClick={openCart}>
        <i className='tabler-shopping-bag' />
        <span>Cart</span>
        <em>{count}</em>
      </button>
    </nav>
  </>
  )
}

export default StoreHeader
