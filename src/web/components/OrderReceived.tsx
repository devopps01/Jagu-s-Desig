import Link from 'next/link'

import { formatPrice } from '@web/data/catalog'

export type ReceiptItem = {
  title: string
  image: string
  qty: number
  size: string
  unit: number
  lineTotal: number
}

export type OrderReceipt = {
  orderNo: string
  paid: boolean
  method: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  discountCode: string
  productSavings: number
  gst: number
  gstRate: number
  gstLabel: string
  shipping: number
  total: number
  name: string
  phone: string
  address: string
}

const OrderReceived = ({ receipt }: { receipt: OrderReceipt }) => {
  const address = [receipt.name, receipt.phone, receipt.address].filter(Boolean)

  return (
    <section className='vn-section vn-receipt-page'>
      <div className='vn-receipt'>
        <header className='vn-receipt-hero'>
          <span className='vn-receipt-mark' aria-hidden='true'>
            <i className='tabler-check' />
          </span>
          <p>{receipt.paid ? 'Payment confirmed' : 'Order placed'}</p>
          <h1>Order received</h1>
          {receipt.orderNo ? <strong>{receipt.orderNo}</strong> : null}
          <span className={`vn-receipt-pill${receipt.paid ? ' is-paid' : ''}`}>
            {receipt.paid ? 'Paid' : 'Cash on delivery'} · {receipt.method || 'Razorpay'}
          </span>
        </header>

        <div className='vn-receipt-grid'>
          <div className='vn-receipt-card'>
            <h2>Your pieces</h2>
            <div className='vn-receipt-items'>
              {receipt.items.map(item => (
                <article key={`${item.title}-${item.size}-${item.unit}`}>
                  {item.image ? <img src={item.image} alt={item.title} /> : <span className='vn-receipt-photo' />}
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.size ? `Size ${item.size} · ` : ''}
                      Qty {item.qty}
                    </p>
                  </div>
                  <strong>{formatPrice(item.lineTotal)}</strong>
                </article>
              ))}
            </div>
          </div>

          <aside className='vn-receipt-card'>
            <h2>Bill</h2>
            <div className='vn-totals'>
              {receipt.productSavings ? (
                <div className='vn-totals-row is-save'>
                  <span>Product discount</span>
                  <strong>− {formatPrice(receipt.productSavings)}</strong>
                </div>
              ) : null}
              <div className='vn-totals-row'>
                <span>Item total</span>
                <strong>{formatPrice(receipt.subtotal)}</strong>
              </div>
              {receipt.discount ? (
                <div className='vn-totals-row is-save'>
                  <span>Coupon {receipt.discountCode}</span>
                  <strong>− {formatPrice(receipt.discount)}</strong>
                </div>
              ) : null}
              <div className='vn-totals-row'>
                <span>Shipping</span>
                <strong>{receipt.shipping ? formatPrice(receipt.shipping) : 'Free'}</strong>
              </div>
              {receipt.gst ? (
                <div className='vn-totals-row'>
                  <span>
                    {receipt.gstLabel}
                    {receipt.gstRate ? ` (${receipt.gstRate}%)` : ''}
                  </span>
                  <strong>{formatPrice(receipt.gst)}</strong>
                </div>
              ) : null}
              <div className='vn-totals-row is-total'>
                <span>{receipt.paid ? 'Paid' : 'To pay'}</span>
                <strong>{formatPrice(receipt.total)}</strong>
              </div>
            </div>
            {address.length ? (
              <div className='vn-receipt-address'>
                <h2>Delivery</h2>
                {address.map(line => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </aside>
        </div>

        <div className='vn-receipt-actions'>
          {receipt.orderNo ? (
            <Link className='vn-btn vn-btn-solid' href={`/track-order?order=${receipt.orderNo}`}>
              Track order
            </Link>
          ) : null}
          <Link className='vn-btn vn-btn-outline' href='/account?tab=orders'>
            My orders
          </Link>
          <Link className='vn-btn vn-btn-outline' href='/collections/all'>
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  )
}

export default OrderReceived
