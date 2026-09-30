'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import ProductPrices from '@web/components/ProductPrices'
import type { StoreProduct } from '@web/data/catalog'
import { useCart } from '@web/context/CartContext'
import { SectionHeader } from '@web/components/ProductGrid'
import ProductGallery from '@web/components/ProductGallery'
import ProductSlider from '@web/components/ProductSlider'
import WishlistButton from '@web/components/WishlistButton'
import ProductReviews, { ProductRatingBadge } from '@web/components/ProductReviews'
import GoogleReviewsBlock from '@web/components/GoogleReviewsBlock'
import ProductAssure from '@web/components/ProductAssure'
import ProductDealBanner from '@web/components/ProductDealBanner'
import ProductInfoTabs from '@web/components/ProductInfoTabs'
import HomeFeatures from '@web/components/HomeFeatures'
import { RENT_SIZES } from '@/libs/rent-sizes'
import { getViewedSlugs, rememberViewed } from '@web/lib/recently-viewed'
import { storeWhatsAppHref } from '@/libs/contact-types'

const ProductPage = ({ slug, initialProduct }: { slug: string; initialProduct?: StoreProduct | null }) => {
  const router = useRouter()
  const { addItem } = useCart()
  const [product, setProduct] = useState<StoreProduct | null>(initialProduct || null)
  const [related, setRelated] = useState<StoreProduct[]>([])
  const [recent, setRecent] = useState<StoreProduct[]>([])
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState(1)
  const [shareNote, setShareNote] = useState('')
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    rememberViewed(slug)

    fetch(`/api/web/products/${slug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json) setProduct(json)
      })
      .catch(() => {})

    fetch('/api/web/products')
      .then(res => res.json())
      .then(json => {
        const all = Array.isArray(json) ? (json as StoreProduct[]) : []
        const viewed = getViewedSlugs(slug)

        setRelated(all.filter(item => item.slug !== slug).slice(0, 8))
        setRecent(viewed.map(item => all.find(productItem => productItem.slug === item)).filter(Boolean) as StoreProduct[])
      })
      .catch(() => {
        setRelated([])
        setRecent([])
      })
  }, [slug])

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [slug])

  if (!product) {
    return <p className='vn-section'>Loading product...</p>
  }

  const cartOptions = { size, qty }

  const shareProduct = async () => {
    const url = window.location.href
    const text = `${product.title} — Jagu's Designing`

    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, text, url })
        setShareNote('Shared')
      } else {
        await navigator.clipboard.writeText(url)
        setShareNote('Link copied')
      }
    } catch {
      await navigator.clipboard.writeText(url)
      setShareNote('Link copied')
    }

    window.setTimeout(() => setShareNote(''), 1800)
  }

  return (
    <div className='vn-pdp'>
      {product.reviews ? (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.title,
              image: product.image,
              brand: { '@type': 'Brand', name: "Jagu's Designing" },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviews,
                bestRating: 5,
                worstRating: 1
              }
            })
          }}
        />
      ) : null}
      <section className='vn-product'>
        <ProductGallery product={product} />
        <div className='vn-product-info'>
          <p className='vn-product-kicker'>{product.style || 'Chaniya Choli'}</p>
          <h1>{product.title}</h1>
          <ProductRatingBadge rating={product.rating} reviews={product.reviews} google={product.googleReviews} />
          <ProductPrices
            sellingPrice={product.sellingPrice}
            sellingMrp={product.sellingMrp}
            rentPrice={product.rentPrice}
            rentMrp={product.rentMrp}
            listingType={product.listingType}
            compareAt={product.compareAt}
            fallback={product.price}
          />

          <ProductDealBanner />

          <div className='vn-product-trust' aria-label='Store promises'>
            <span>
              <i className='tabler-truck' />
              Free India shipping
            </span>
            <span>
              <i className='tabler-cash' />
              Cash on delivery
            </span>
            <span>
              <i className='tabler-refresh' />
              Easy exchange
            </span>
            <span>
              <i className='tabler-shield-check' />
              Quality checked
            </span>
          </div>

          <div className='vn-option-block'>
            <strong>Size</strong>
            <div className='vn-size-row'>
              {RENT_SIZES.map(item => (
                <button key={item} type='button' className={size === item ? 'is-on' : ''} onClick={() => setSize(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className='vn-option-block'>
            <strong>Quantity</strong>
            <div className='vn-qty-row'>
              <div className='vn-qty is-lg'>
                <button type='button' aria-label='Decrease quantity' onClick={() => setQty(current => Math.max(1, current - 1))}>
                  −
                </button>
                <span>{qty}</span>
                <button type='button' aria-label='Increase quantity' onClick={() => setQty(current => Math.min(20, current + 1))}>
                  +
                </button>
              </div>
              <div className='vn-product-tools'>
                <WishlistButton product={product} className='is-text' />
                <button className='vn-tool-btn' type='button' onClick={() => void shareProduct()}>
                  <i className='tabler-share' />
                  {shareNote || 'Share'}
                </button>
                <a
                  className='vn-tool-btn'
                  href={storeWhatsAppHref(`Hi Jagu’s Designing, I want to ask about ${product.title} ${pageUrl}`)}
                  target='_blank'
                  rel='noreferrer'
                >
                  <i className='tabler-brand-whatsapp' />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className='vn-product-actions'>
            <button className='vn-btn vn-btn-outline' type='button' onClick={() => addItem(product, cartOptions)}>
              Add to cart
            </button>
            <button
              className='vn-btn vn-btn-solid'
              type='button'
              onClick={() => {
                addItem(product, { ...cartOptions, open: false })
                router.push('/checkout')
              }}
            >
              Buy now
            </button>
          </div>

          <ul className='vn-buy-assure' aria-label='Purchase promises'>
            <li>
              <i className='tabler-world' />
              <strong>Worldwide Shipping</strong>
              <span>Ships fast, arrives globally safe</span>
            </li>
            <li>
              <i className='tabler-package' />
              <strong>100% Original Product</strong>
              <span>Authentic, verified and original</span>
            </li>
            <li>
              <i className='tabler-rosette-discount-check' />
              <strong>Best Price Guaranteed</strong>
              <span>Lowest price, top quality assured</span>
            </li>
          </ul>

        </div>
      </section>
      <ProductInfoTabs product={product} />
      <ProductAssure />
      <div className='vn-review-stage' id='reviews'>
        <ProductReviews
          slug={product.slug}
          onSummary={(average, count) =>
            setProduct(current => {
              if (!current) return current
              if (count > 0) return { ...current, rating: average, reviews: count, googleReviews: false }

              return current
            })
          }
        />
        <GoogleReviewsBlock variant='product' />
      </div>
      {related.length ? (
        <section className='vn-section vn-pdp-slider'>
          <SectionHeader title='You may also like' />
          <ProductSlider products={related} />
        </section>
      ) : null}
      {recent.length ? (
        <section className='vn-section vn-pdp-slider'>
          <SectionHeader title='Recently viewed' />
          <ProductSlider products={recent} />
        </section>
      ) : null}
      <HomeFeatures />
    </div>
  )
}

export default ProductPage
