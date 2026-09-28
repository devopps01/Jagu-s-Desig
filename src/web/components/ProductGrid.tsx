import Link from 'next/link'

import ProductCard from '@web/components/ProductCard'
import type { StoreProduct } from '@web/data/catalog'

export const SectionHeader = ({ title, href, note }: { title: string; href?: string; note?: string }) => (
  <div className='vn-section-head'>
    {note ? <p className='vn-section-note'>{note}</p> : null}
    <h2>{title}</h2>
    <div className='vn-rule' />
    {href ? (
      <Link className='vn-view-all' href={href}>
        View all
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
