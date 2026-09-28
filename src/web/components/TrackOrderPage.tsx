'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import OrderBill from '@web/components/OrderBill'
import OrderRequestForm from '@web/components/OrderRequestForm'
import ReviewWriteModal from '@web/components/ReviewWriteModal'
import { useLoginModal } from '@web/context/LoginModalContext'
import { canCancelOrder, canReturnOrder } from '@/libs/order-request-types'

type TrackItem = {
  title: string
  qty: number
  image: string
  slug: string
  size?: string
  canReview?: boolean
  reviewed?: boolean
}

type Tracked = {
  id: string
  orderNo: string
  status: string
  payment: string
  total: number
  subtotal?: number
  shipping?: number
  discountCode?: string
  discountAmount?: number
  gstAmount?: number
  gstRate?: number
  gstLabel?: string
  items: TrackItem[]
  customer: { name?: string; phone?: string; city?: string }
  cancelRequestStatus?: string
  returnRequestStatus?: string
  deliveredAt?: string | null
  createdAt: string
  canReview?: boolean
  requests?: { type: string; status: string; reason: string }[]
}

type ReviewTarget = {
  slug: string
  title: string
  orderId: string
  orderNo: string
}

const steps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

const TrackOrderPage = () => {
  const params = useSearchParams()
  const { user, openLogin } = useLoginModal()
  const [orderNo, setOrderNo] = useState(params.get('order') || params.get('orderNo') || '')
  const [lookup, setLookup] = useState(params.get('phone') || params.get('email') || '')
  const [order, setOrder] = useState<Tracked | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'cancel' | 'return' | ''>('')
  const [review, setReview] = useState<ReviewTarget | null>(null)

  const load = async (no = orderNo, key = lookup) => {
    setLoading(true)
    setError('')
    setAction('')

    const res = await fetch(`/api/web/orders/track?orderNo=${encodeURIComponent(no)}&lookup=${encodeURIComponent(key)}`)
    const json = await res.json()

    setLoading(false)

    if (!res.ok) {
      setOrder(null)
      setError(json.message || 'Order not found')

      return
    }

    setOrder(json)
  }

  useEffect(() => {
    if (params.get('order') && (params.get('phone') || params.get('email'))) {
      void load(params.get('order') || '', params.get('phone') || params.get('email') || '')
    }
  }, [params])

  const canCancel = order ? canCancelOrder(order.status, order.cancelRequestStatus) : false
  const canReturn = order ? canReturnOrder(order.status, order.deliveredAt || order.createdAt, order.returnRequestStatus) : false
  const stopped = order?.status === 'cancelled' || order?.status === 'returned'
  const activeIndex = order ? steps.indexOf(order.status) : -1

  const startReview = (item: TrackItem) => {
    if (!order) return

    if (!user) {
      openLogin()

      return
    }

    setReview({
      slug: item.slug,
      title: item.title,
      orderId: order.id,
      orderNo: order.orderNo
    })
  }

  return (
    <section className='vn-section vn-track'>
      <div className='vn-page-hero'>
        <p className='vn-hero-kicker'>Orders</p>
        <h1>Track order</h1>
        <div className='vn-rule' />
        <p>Enter your order number and the phone or email used at checkout.</p>
      </div>
      <form
        className='vn-form'
        onSubmit={event => {
          event.preventDefault()
          void load()
        }}
      >
        <input placeholder='Order number, e.g. JD20260001' required value={orderNo} onChange={event => setOrderNo(event.target.value)} />
        <input placeholder='Phone or email' required value={lookup} onChange={event => setLookup(event.target.value)} />
        {error ? <p className='vn-contact-error'>{error}</p> : null}
        <button className='vn-btn vn-btn-solid' type='submit' disabled={loading}>
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {order ? (
        <article className='vn-order-card vn-track-card'>
          <div className='vn-order-top'>
            <div>
              <strong>{order.orderNo}</strong>
              <p>
                {order.customer.name} · {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className='vn-order-status'>{order.status}</span>
          </div>
          {!stopped ? (
            <ol className='vn-track-steps'>
              {steps.map((step, index) => (
                <li key={step} className={index <= activeIndex ? 'is-on' : ''}>
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className='vn-drawer-note'>
              This order is {order.status}. Payment: {order.payment}.
            </p>
          )}
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
                  <button className='vn-btn vn-btn-outline vn-order-review-btn' type='button' onClick={() => startReview(item)}>
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
          {order.cancelRequestStatus ? <p className='vn-drawer-note'>Cancel request: {order.cancelRequestStatus}</p> : null}
          {order.returnRequestStatus ? <p className='vn-drawer-note'>Return request: {order.returnRequestStatus}</p> : null}
          <div className='vn-account-actions'>
            {canCancel ? (
              <button className='vn-btn vn-btn-outline' type='button' onClick={() => setAction(action === 'cancel' ? '' : 'cancel')}>
                Cancel order
              </button>
            ) : null}
            {canReturn ? (
              <button className='vn-btn vn-btn-outline' type='button' onClick={() => setAction(action === 'return' ? '' : 'return')}>
                Return / exchange
              </button>
            ) : null}
            <Link className='vn-btn vn-btn-outline' href='/returns'>
              Return policy
            </Link>
            <Link className='vn-btn vn-btn-outline' href='/contact'>
              Need help
            </Link>
          </div>
          {action ? (
            <OrderRequestForm
              key={action}
              type={action}
              orderId={order.id}
              orderNo={order.orderNo}
              phone={lookup}
              onDone={() => void load()}
            />
          ) : null}
        </article>
      ) : null}

      {review ? (
        <ReviewWriteModal
          open
          slug={review.slug}
          productTitle={review.title}
          orderId={review.orderId}
          orderNo={review.orderNo}
          onClose={() => setReview(null)}
          onSaved={() => void load()}
        />
      ) : null}

      <div className='vn-policy-prose' style={{ marginTop: 36 }}>
        <article>
          <h2>How tracking works</h2>
          <p>
            The order number is on your confirmation message and on the bill. Use the same phone or email you typed at checkout. Guests and logged-in customers use this same page.
          </p>
          <p>
            Status moves New → Confirmed → Packed → Shipped → Delivered. Cancel is open until Packed. After Shipped, wait for delivery and use Return within 7 days. After delivery you can review each piece from this page.
          </p>
        </article>
        <article>
          <h2>If you cannot find the order</h2>
          <p>Check the zeros and letters in the order number. JD20260001 is not the same as a courier AWB. If the phone has changed, try the email, or write on Contact us with your name and city.</p>
          <ul>
            <li>Do not share your OTP with a caller who claims they need it to track</li>
            <li>A missing WhatsApp update does not mean the order is lost — check here first</li>
            <li>Store pickup orders stay Packed until you collect</li>
          </ul>
        </article>
      </div>
    </section>
  )
}

export default TrackOrderPage
