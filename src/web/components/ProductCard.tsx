'use client'

import Link from 'next/link'

import { type StoreProduct } from '@web/data/catalog'
import { useCart } from '@web/context/CartContext'
import ProductMedia from '@web/components/ProductMedia'
import ListingBadges from '@web/components/ListingBadges'
import ProductPrices from '@web/components/ProductPrices'
import WishlistButton from '@web/components/WishlistButton'

const cardImages = (product: StoreProduct) => {
  const list = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
  const primary = list[0] || ''
  const secondary = list.find(src => src !== primary) || ''

  return { primary, secondary, hasSwap: Boolean(primary && secondary) }
}

const ProductCard = ({ product }: { product: StoreProduct }) => {
  const { addItem } = useCart()
  const { primary, secondary, hasSwap } = cardImages(product)
  const alt = product.imageAlt || product.title

  return (
    <article className='vn-card'>
      <div className={`vn-card-media${hasSwap ? ' has-swap' : ' has-zoom'}`}>
        <Link href={`/products/${product.slug}`} className='vn-card-media-link'>
          <ProductMedia src={primary} alt={alt} className='is-primary' />
          {hasSwap ? <ProductMedia src={secondary} alt={`${alt} — alternate view`} className='is-hover' /> : null}
        </Link>
        <ListingBadges />
        <WishlistButton product={product} />
        <button
          className='vn-card-cart'
          type='button'
          onClick={event => {
            event.preventDefault()
            addItem(product, { size: 'M' })
          }}
        >
          Add to cart
        </button>
      </div>
      <div className='vn-card-body'>
        <h3>
          <Link href={`/products/${product.slug}`} title={product.title}>
            {product.title}
          </Link>
        </h3>
        {product.reviews ? (
          <Link className='vn-rating-badge' href={product.googleReviews ? `/products/${product.slug}#google-reviews` : `/products/${product.slug}#reviews`}>
            <span className='vn-stars is-sm'>
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={star <= Math.round(product.rating) ? 'is-on' : ''}>
                  ★
                </span>
              ))}
            </span>
            <span>
              {product.googleReviews ? 'Google ' : ''}
              {product.rating.toFixed(1)} · {product.reviews}
            </span>
          </Link>
        ) : null}
        <ProductPrices
          sellingPrice={product.sellingPrice}
          sellingMrp={product.sellingMrp}
          rentPrice={product.rentPrice}
          rentMrp={product.rentMrp}
          listingType={product.listingType}
          compareAt={product.compareAt}
          fallback={product.price}
        />
      </div>
    </article>
  )
}

export default ProductCard
