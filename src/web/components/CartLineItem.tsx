'use client'

import Link from 'next/link'

import { formatPrice } from '@web/data/catalog'
import { lineUnitPrice, type CartLine } from '@web/context/CartContext'

const CartLineItem = ({
  line,
  onRemove,
  onQty,
  onNavigate
}: {
  line: CartLine
  onRemove: () => void
  onQty: (qty: number) => void
  onNavigate?: () => void
}) => {
  const unit = lineUnitPrice(line)
  const lineTotal = unit * line.qty
  const mrp = line.product.sellingMrp || 0

  return (
    <article className='vn-cart-item'>
      <Link href={`/products/${line.product.slug}`} className='vn-cart-thumb' onClick={onNavigate}>
        <img src={line.product.image} alt={line.product.title} />
      </Link>
      <div className='vn-cart-info'>
        <div className='vn-cart-top'>
          <Link href={`/products/${line.product.slug}`} onClick={onNavigate}>
            <h3>{line.product.title}</h3>
          </Link>
          <button className='vn-cart-remove' type='button' onClick={onRemove} aria-label='Remove'>
            <i className='tabler-trash' />
          </button>
        </div>
        {line.size ? <p className='vn-cart-meta'>Size {line.size}</p> : null}
        <p className='vn-cart-unit'>
          {mrp > unit ? (
            <>
              <span className='vn-cart-mrp'>{formatPrice(mrp)}</span>
              <span>{formatPrice(unit)} each</span>
            </>
          ) : (
            <span>{formatPrice(unit)} each</span>
          )}
        </p>
        <div className='vn-cart-tools'>
          <div className='vn-qty'>
            <button type='button' aria-label='Decrease quantity' onClick={() => onQty(line.qty - 1)}>
              −
            </button>
            <span>{line.qty}</span>
            <button type='button' aria-label='Increase quantity' onClick={() => onQty(line.qty + 1)}>
              +
            </button>
          </div>
          <strong className='vn-cart-line-total'>{formatPrice(lineTotal)}</strong>
        </div>
      </div>
    </article>
  )
}

export default CartLineItem
