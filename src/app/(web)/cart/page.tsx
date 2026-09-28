'use client'

import Link from 'next/link'

import CartLineItem from '@web/components/CartLineItem'
import CartTotals from '@web/components/CartTotals'
import { useCart } from '@web/context/CartContext'

const CartPage = () => {
  const { lines, removeItem, setQty, count, subtotal } = useCart()

  return (
    <section className='vn-section vn-cart-wrap'>
      <div className='vn-page-hero'>
        <p className='vn-section-note'>Your bag</p>
        <h1>Shopping cart</h1>
        <div className='vn-rule' />
        {count ? (
          <p className='vn-cart-count-line'>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        ) : null}
      </div>
      {lines.length === 0 ? (
        <div className='vn-drawer-empty vn-cart-page-empty'>
          <i className='tabler-shopping-bag' />
          <p>Your bag is empty</p>
          <span>Add a chaniya choli you love and it will show up here.</span>
          <Link className='vn-btn vn-btn-solid' href='/collections/all'>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className='vn-cart-page'>
          <div className='vn-cart-list'>
            {lines.map(line => (
              <CartLineItem
                key={line.id}
                line={line}
                onRemove={() => removeItem(line.id)}
                onQty={qty => setQty(line.id, qty)}
              />
            ))}
          </div>
          <aside className='vn-cart-summary'>
            <h2>Order summary</h2>
            <CartTotals count={count} subtotal={subtotal} />
          </aside>
        </div>
      )}
    </section>
  )
}

export default CartPage
