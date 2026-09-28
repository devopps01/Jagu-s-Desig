import Link from 'next/link'

import { formatPrice } from '@web/data/catalog'

const CartTotals = ({
  count,
  subtotal,
  checkoutHref = '/checkout',
  shopHref = '/collections/all',
  onCheckout,
  onShop,
  checkoutAsButton
}: {
  count: number
  subtotal: number
  checkoutHref?: string
  shopHref?: string
  onCheckout?: () => void
  onShop?: () => void
  checkoutAsButton?: boolean
}) => {
  const shipping = 0
  const total = subtotal + shipping

  return (
    <div className='vn-totals'>
      <div className='vn-totals-row'>
        <span>Items</span>
        <strong>
          {count} {count === 1 ? 'item' : 'items'}
        </strong>
      </div>
      <div className='vn-totals-row'>
        <span>Subtotal</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
      <div className='vn-totals-row'>
        <span>Shipping</span>
        <strong>{shipping ? formatPrice(shipping) : 'Free'}</strong>
      </div>
      <div className='vn-totals-row is-total'>
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <p className='vn-drawer-note'>Inclusive of taxes. Shipping calculated at checkout if applicable.</p>
      {count ? (
        checkoutAsButton ? (
          <button className='vn-btn vn-btn-solid vn-drawer-cta' type='button' onClick={onCheckout}>
            Checkout
          </button>
        ) : (
          <Link className='vn-btn vn-btn-solid vn-drawer-cta' href={checkoutHref} onClick={onCheckout}>
            Checkout
          </Link>
        )
      ) : null}
      {onShop && checkoutAsButton ? (
        <button className='vn-btn vn-btn-outline vn-drawer-cta' type='button' onClick={onShop}>
          Continue shopping
        </button>
      ) : (
        <Link className='vn-btn vn-btn-outline vn-drawer-cta' href={shopHref} onClick={onShop}>
          Continue shopping
        </Link>
      )}
    </div>
  )
}

export default CartTotals
