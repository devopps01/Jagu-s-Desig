import { notFound } from 'next/navigation'

import ProductPage from '@web/components/ProductPage'
import { getStoreProduct } from '@/libs/products'

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const product = await getStoreProduct(slug)

  if (!product) return { title: 'Product | Jagu\'s Designing' }

  return {
    title: product.seoTitle || `${product.title} | Jagu's Designing`,
    description: product.seoDescription || product.description || product.title
  }
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const product = await getStoreProduct(slug)

  if (!product) notFound()

  return <ProductPage slug={slug} initialProduct={product} />
}

export default Page
