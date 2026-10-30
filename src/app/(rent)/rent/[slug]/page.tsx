import { notFound } from 'next/navigation'

import RentProduct from '@/rent/RentProduct'
import RentUnavailable from '@/rent/RentUnavailable'
import { getRentStoreProduct, listRentStoreProducts } from '@/libs/products'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  try {
    const product = await getRentStoreProduct(slug)

    if (!product) return { title: "Jagu's Rent" }

    return {
      title: `${product.title} | Jagu's Rent`,
      description: product.description || `Rent ${product.title}`
    }
  } catch {
    return { title: "Jagu's Rent" }
  }
}

const Page = async ({ params }: Props) => {
  const { slug } = await params
  let product: Awaited<ReturnType<typeof getRentStoreProduct>>
  let all: Awaited<ReturnType<typeof listRentStoreProducts>>

  try {
    ;[product, all] = await Promise.all([getRentStoreProduct(slug), listRentStoreProducts()])
  } catch {
    return <RentUnavailable />
  }

  if (!product) notFound()

  const related = all.filter(item => item.slug !== product.slug).slice(0, 8)

  return <RentProduct product={product} related={related} />
}

export default Page
