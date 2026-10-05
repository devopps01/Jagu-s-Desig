import { getDb } from '@/libs/mongo'
import { listStoreProducts } from '@/libs/products'
import { defaultFilters, getProductFilterValue, optionMatchesProduct, styleValues, type FilterDoc } from '@/libs/filter-utils'
import { slugify } from '@/libs/slug'

export type { FilterDoc, FilterKey, FilterOption, FilterSource } from '@/libs/filter-utils'
export { defaultFilters, getProductFilterValue, optionMatchesProduct } from '@/libs/filter-utils'

const ensureFilters = async () => {
  const db = await getDb()
  const count = await db.collection('CollectionFilter').countDocuments()

  if (count === 0) {
    await db.collection('CollectionFilter').insertMany(defaultFilters())
  }

  return db
}

export const listFilters = async () => {
  const db = await ensureFilters()
  const rows = await db.collection<FilterDoc>('CollectionFilter').find({}).sort({ sortOrder: 1 }).toArray()

  return rows.map(({ _id, ...rest }) => rest as FilterDoc)
}

export const updateFilter = async (key: string, input: Partial<FilterDoc>) => {
  const db = await ensureFilters()
  const $set: Record<string, unknown> = {}

  if (typeof input.label === 'string') $set.label = input.label.trim()
  if (typeof input.show === 'boolean') $set.show = input.show
  if (input.source === 'product' || input.source === 'static') $set.source = input.source
  if (typeof input.showPills === 'boolean') $set.showPills = input.showPills
  if (Array.isArray(input.options)) {
    $set.options = input.options
      .filter(item => item.label?.trim())
      .map(item => ({
        label: item.label.trim(),
        value: item.value?.trim() || slugify(item.label),
        min: item.min,
        max: item.max,
        active: item.active !== false
      }))
  }

  await db.collection('CollectionFilter').updateOne({ key }, { $set })
}

export const resolveCollectionFilters = async (slug: string) => {
  const filters = await listFilters()
  const products = await listStoreProducts(slug)
  const prices = products.flatMap(item => [item.sellingPrice, item.rentPrice, item.price].filter((value): value is number => typeof value === 'number' && value > 0))
  const minPrice = prices.length ? Math.min(...prices, 0) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0

  return {
    minPrice,
    maxPrice,
    filters: filters
      .filter(item => item.show)
      .map(item => {
        const staticOptions = (item.options || []).filter(option => option.active !== false)
        const present =
          item.key === 'style'
            ? Array.from(new Set(products.flatMap(product => styleValues(product))))
            : Array.from(new Set(products.map(product => getProductFilterValue(product, item.key)).filter(Boolean)))

        const options =
          item.key === 'price'
            ? staticOptions.filter(option => products.some(product => optionMatchesProduct(product, 'price', option)))
            : present.map(label => {
                const saved = staticOptions.find(
                  option => slugify(option.value) === slugify(label) || slugify(option.label) === slugify(label)
                )

                return {
                  label: saved?.label || label,
                  value: saved?.value || slugify(label),
                  active: true
                }
              })

        return {
          key: item.key,
          label: item.label,
          type: item.type,
          source: item.source,
          showPills: item.showPills,
          options
        }
      })
      .filter(item => item.options.length > 0)
  }
}
