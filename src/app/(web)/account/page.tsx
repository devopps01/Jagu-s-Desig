'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { formatPrice } from '@web/data/catalog'
import { ProductGrid } from '@web/components/ProductGrid'
import OrderRequestForm from '@web/components/OrderRequestForm'
import OrderBill from '@web/components/OrderBill'
import ReviewWriteModal from '@web/components/ReviewWriteModal'
import { AddressBook } from '@web/components/AddressBook'
import { useWishlist } from '@web/context/WishlistContext'
import { useLoginModal } from '@web/context/LoginModalContext'

type Tab = 'overview' | 'orders' | 'wishlist' | 'referral' | 'profile'

type OrderItem = {
  title: string
  qty: number
  image: string
  slug: string
  size?: string
  canReview?: boolean
  reviewed?: boolean
}

type OrderRow = {
  id: string
  orderNo?: string
  invoiceNo?: string
  status: string
  payment?: string
  total: number
  subtotal?: number
  shipping?: number
  items: OrderItem[]
  customer: { address?: string; city?: string; pincode?: string; phone?: string; name?: string }
  sisterName?: string
  discountCode?: string
  discountAmount?: number
  gstAmount?: number
  gstRate?: number
  gstLabel?: string
  canCancel?: boolean
  canReturn?: boolean
  canReview?: boolean
  cancelRequestStatus?: string
  returnRequestStatus?: string
  createdAt: string
}

type ReviewTarget = {
  slug: string
  title: string
  orderId: string
  orderNo?: string
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'tabler-layout-dashboard' },
  { id: 'orders', label: 'Orders', icon: 'tabler-package' },
  { id: 'wishlist', label: 'Wishlist', icon: 'tabler-heart' },
  { id: 'referral', label: 'Referral', icon: 'tabler-share' },
  { id: 'profile', label: 'Profile', icon: 'tabler-user' }
]

const AccountDesk = () => {
  const router = useRouter()
  const params = useSearchParams()
  const { user, ready, openLogin, refreshUser } = useLoginModal()
  const { items: wished, count: wishCount } = useWishlist()
  const tab = (tabs.some(item => item.id === params.get('tab')) ? params.get('tab') : 'overview') as Tab
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [copied, setCopied] = useState(false)
  const [action, setAction] = useState<{ id: string; type: 'cancel' | 'return' } | null>(null)
  const [review, setReview] = useState<ReviewTarget | null>(null)

  const loadOrders = () => {
    fetch('/api/web/account/orders')
      .then(res => (res.ok ? res.json() : []))
      .then(json => setOrders(Array.isArray(json) ? json : []))
      .catch(() => setOrders([]))
  }

  useEffect(() => {
    if (!ready) return
    if (!user && tab !== 'wishlist') {
      openLogin()
      router.replace(`/login?next=${encodeURIComponent(`/account?tab=${tab}`)}`)
    }
  }, [openLogin, ready, router, tab, user])

  useEffect(() => {
    if (!user) return

    loadOrders()
  }, [user])

  const referralCode = user && 'referralCode' in user ? String(user.referralCode || '') : ''
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : referralCode
  const latestAddress = orders[0]?.customer
  const setTab = (next: Tab) => router.replace(`/account?tab=${next}`)

  const logout = async () => {
    await fetch('/api/web/auth/logout', { method: 'POST' })
    await refreshUser()
    router.replace('/')
  }

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const orderTotal = useMemo(() => orders.reduce((sum, item) => sum + (item.total || 0), 0), [orders])

  return (
    <section className='vn-account-wrap'>
      <div className='vn-account'>
        <header className='vn-account-head'>
          <div>
            <h1>My account</h1>
            <p>{user ? user.email : 'Guest wishlist'}</p>
          </div>
          <div className='vn-account-head-actions'>
            <Link className='vn-btn vn-btn-outline' href='/'>
              Home
            </Link>
            {user ? (
              <button className='vn-btn' type='button' onClick={() => void logout()}>
                Logout
              </button>
            ) : null}
          </div>
        </header>
        <nav className='vn-account-nav'>
          <div className='vn-account-nav-inner'>
            {tabs.map(item => (
              <button key={item.id} type='button' className={tab === item.id ? 'is-on' : ''} onClick={() => setTab(item.id)}>
                <i className={item.icon} />
                {item.label}
                {item.id === 'wishlist' ? <em>{wishCount}</em> : null}
                {item.id === 'orders' ? <em>{orders.length}</em> : null}
              </button>
            ))}
          </div>
        </nav>

        <div className='vn-account-panel'>
          {tab === 'overview' && user ? (
            <>
              <h2>Overview</h2>
              <div className='vn-account-stats'>
                <article>
                  <strong>{orders.length}</strong>
                  <span>Orders</span>
                </article>
                <article>
                  <strong>{wishCount}</strong>
                  <span>Wishlist</span>
                </article>
                <article>
                  <strong>{formatPrice(orderTotal)}</strong>
                  <span>Order value</span>
                </article>
              </div>
              <p>Welcome back. Track orders, save pieces you love, and share your referral code with sisters and friends.</p>
              <div className='vn-account-actions'>
                <button className='vn-btn vn-btn-solid' type='button' onClick={() => setTab('orders')}>
                  View orders
                </button>
                <Link className='vn-btn vn-btn-outline' href='/collections/all'>
                  Continue shopping
                </Link>
              </div>
            </>
          ) : null}

          {tab === 'orders' && user ? (
            orders.length ? (
              <>
                <h2>Orders</h2>
                <div className='vn-order-list'>
                {orders.map(order => (
                  <article key={order.id} className='vn-order-card'>
                    <div className='vn-order-top'>
                      <div>
                        <strong>{order.orderNo || `Order ${order.id.slice(-6).toUpperCase()}`}</strong>
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className='vn-order-status'>{order.status}</span>
                    </div>
                    <div className='vn-order-items'>
                      {order.items.map(item => (
                        <div key={`${item.slug}-${item.size || ''}`} className='vn-order-item-row'>
                          <Link href={`/products/${item.slug}`}>
                            <img src={item.image} alt={item.title} />
                            <span>
                              {item.title}
                              {item.size ? ` · Size ${item.size}` : ''} × {item.qty}
                            </span>
                          </Link>
                          {item.canReview ? (
                            <button
                              className='vn-btn vn-btn-outline vn-order-review-btn'
                              type='button'
                              onClick={() =>
                                setReview({
                                  slug: item.slug,
                                  title: item.title,
                                  orderId: order.id,
                                  orderNo: order.orderNo
                                })
                              }
                            >
                              {item.reviewed ? 'Update review' : 'Review'}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <OrderBill
                      subtotal={order.subtotal}
                      discountCode={order.discountCode}
                      discountAmount={order.discountAmount}
                      shipping={order.shipping}
                      gstAmount={order.gstAmount}
                      gstRate={order.gstRate}
                      gstLabel={order.gstLabel}
                      total={order.total}
                    />
                    {order.sisterName ? <p className='vn-drawer-note'>Sister: {order.sisterName}</p> : null}
                    {order.cancelRequestStatus ? <p className='vn-drawer-note'>Cancel request: {order.cancelRequestStatus}</p> : null}
                    {order.returnRequestStatus ? <p className='vn-drawer-note'>Return request: {order.returnRequestStatus}</p> : null}
                    <div className='vn-account-actions'>
                      <Link className='vn-btn vn-btn-outline' href={`/track-order?order=${order.orderNo || ''}&phone=${order.customer?.phone || ''}`}>
                        Track
                      </Link>
                      {order.canCancel ? (
                        <button className='vn-btn vn-btn-outline' type='button' onClick={() => setAction({ id: order.id, type: 'cancel' })}>
                          Cancel
                        </button>
                      ) : null}
                      {order.canReturn ? (
                        <button className='vn-btn vn-btn-outline' type='button' onClick={() => setAction({ id: order.id, type: 'return' })}>
                          Return
                        </button>
                      ) : null}
                    </div>
                    {action?.id === order.id ? (
                      <OrderRequestForm
                        key={`${action.id}-${action.type}`}
                        type={action.type}
                        orderId={order.id}
                        orderNo={order.orderNo}
                        phone={order.customer?.phone}
                        onDone={() => {
                          setAction(null)
                          loadOrders()
                        }}
                      />
                    ) : null}
                  </article>
                ))}
                </div>
              </>
            ) : (
              <div className='vn-drawer-empty'>
                <p>No orders yet</p>
                <Link className='vn-btn vn-btn-solid' href='/collections/all'>
                  Shop now
                </Link>
              </div>
            )
          ) : null}

          {tab === 'wishlist' ? (
            wished.length ? (
              <>
                <h2>Wishlist</h2>
                <ProductGrid products={wished} />
              </>
            ) : (
              <div className='vn-drawer-empty'>
                <i className='tabler-heart' />
                <p>Your wishlist is empty</p>
                <span>Hover a product and tap the heart to save it here.</span>
                <Link className='vn-btn vn-btn-solid' href='/collections/all'>
                  Browse pieces
                </Link>
              </div>
            )
          ) : null}

          {tab === 'referral' && user ? (
            <div className='vn-referral'>
              <h2>Referral</h2>
              <p>Give your referral code to a sister or friend. They can mention it at checkout, and you stay credited.</p>
              <div className='vn-referral-code'>{referralCode || 'Loading…'}</div>
              <p className='vn-drawer-note'>{referralLink}</p>
              <div className='vn-account-actions'>
                <button className='vn-btn vn-btn-solid' type='button' onClick={() => void copyReferral()}>
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <a className='vn-btn vn-btn-outline' href={`https://wa.me/?text=${encodeURIComponent(`Shop Jagu’s Designing with my code ${referralCode}: ${referralLink}`)}`} target='_blank' rel='noreferrer'>
                  Share on WhatsApp
                </a>
              </div>
            </div>
          ) : null}

          {tab === 'profile' && user ? (
            <div className='vn-profile'>
              <h2>Profile</h2>
              <p>
                <strong>Email</strong>
                <span>{user.email}</span>
              </p>
              <div className='vn-profile-addresses'>
                <h3>Saved addresses</h3>
                <p className='vn-drawer-note'>Add more than one address — home, work, family or any other. Each one is saved to your account.</p>
                <AddressBook
                  mode='manage'
                  seed={
                    latestAddress
                      ? {
                          name: latestAddress.name || '',
                          phone: latestAddress.phone || '',
                          address: latestAddress.address || '',
                          city: latestAddress.city || '',
                          pincode: latestAddress.pincode || ''
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {review ? (
        <ReviewWriteModal
          open
          slug={review.slug}
          productTitle={review.title}
          orderId={review.orderId}
          orderNo={review.orderNo}
          onClose={() => setReview(null)}
          onSaved={loadOrders}
        />
      ) : null}
    </section>
  )
}

const AccountPage = () => (
  <Suspense fallback={<section className='vn-section'>Loading account…</section>}>
    <AccountDesk />
  </Suspense>
)

export default AccountPage
