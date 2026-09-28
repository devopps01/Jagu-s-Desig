'use client'

import type { StoreProduct } from '@web/data/catalog'
import { useWishlist } from '@web/context/WishlistContext'

const WishlistButton = ({ product, className = '' }: { product: StoreProduct; className?: string }) => {
  const { has, toggle } = useWishlist()
  const wished = has(product.slug)

  return (
    <button
      className={`vn-wish ${wished ? 'is-on' : ''} ${className}`.trim()}
      type='button'
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        toggle(product)
      }}
    >
      <i className={wished ? 'tabler-heart-filled' : 'tabler-heart'} />
    </button>
  )
}

export default WishlistButton
