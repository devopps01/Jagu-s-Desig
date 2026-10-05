import Link from 'next/link'

import ProductCard from '@web/components/ProductCard'
import type { StoreProduct } from '@web/data/catalog'

export const SectionHeader = ({
  title,
  href,
  note,
  showTitle = true,
  showNote = true,
  buttonLabel = 'View all'
}: {
  title: string
  href?: string
  note?: string
  showTitle?: boolean
  showNote?: boolean
  buttonLabel?: string
}) => (
  <div className='vn-section-head'>
    {showNote && note ? <p className='vn-section-note'>{note}</p> : null}
    {showTitle && title ? <h2>{title}</h2> : null}
    {showTitle && title ? <div className='vn-rule' /> : null}
    {href ? (
      <Link className='vn-view-all' href={href}>
        {buttonLabel || 'View all'}
      </Link>
    ) : null}
  </div>
)

export const ProductGrid = ({ products }: { products: StoreProduct[] }) => (
  <div className='vn-grid'>
    {products.map(product => (
      <ProductCard key={product.slug} product={product} />
    ))}
  </div>
)
