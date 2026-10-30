import RentCatalog from '@/rent/RentCatalog'
import RentUnavailable from '@/rent/RentUnavailable'
import { listCategories } from '@/libs/categories'
import { listRentStoreProducts } from '@/libs/products'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Jagu's Rent",
  description: 'Browse outfits available for rent.'
}

const Page = async () => {
  try {
    const [products, categories] = await Promise.all([listRentStoreProducts(), listCategories()])
    const collections = categories
      .filter(item => item.status === 'active')
      .map(item => ({ slug: item.slug, name: item.name }))

    return <RentCatalog products={products} collections={collections} />
  } catch {
    return <RentUnavailable />
  }
}

export default Page
