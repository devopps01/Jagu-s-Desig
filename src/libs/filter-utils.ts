import { slugify } from '@/libs/slug'
import type { StoreProduct } from '@web/data/catalog'

export type FilterSource = 'product' | 'static'
export type FilterKey = 'price' | 'fabric' | 'color' | 'craft' | 'occasion' | 'design' | 'style'

export type FilterOption = {
  label: string
  value: string
  min?: number
  max?: number
  active?: boolean
}

export type FilterDoc = {
  key: FilterKey
  label: string
  show: boolean
  source: FilterSource
  type: 'range' | 'list'
  productField: FilterKey
  showPills: boolean
  sortOrder: number
  options: FilterOption[]
}

export const FILTER_COLORS = ['Red', 'Pink', 'Yellow', 'Green', 'Black', 'White', 'Purple', 'Gold', 'Blue', 'Ivory', 'Maroon', 'Orange', 'Beige', 'Grey', 'Brown']
export const FILTER_CRAFTS = ['Banarasi', 'Kanjivaram', 'Kalamkari', 'Ajrakh', 'Bagru', 'Batik', 'Bandhani', 'Ikat', 'Paithani', 'Jamdani', 'Handloom', 'Zari']

export const defaultFilters = (): FilterDoc[] => [
  {
    key: 'price',
    label: 'Price',
    show: true,
    source: 'static',
    type: 'range',
    productField: 'price',
    showPills: true,
    sortOrder: 10,
    options: [
      { label: 'Under ₹5,000', value: '0-5000', min: 0, max: 5000, active: true },
      { label: '₹5,000 – ₹9,999', value: '5000-9999', min: 5000, max: 9999, active: true },
      { label: '₹10,000 – ₹14,999', value: '10000-14999', min: 10000, max: 14999, active: true },
      { label: '₹15,000 & above', value: '15000-999999', min: 15000, max: 999999, active: true }
    ]
  },
  {
    key: 'fabric',
    label: 'Fabric',
    show: true,
    source: 'static',
    type: 'list',
    productField: 'fabric',
    showPills: true,
    sortOrder: 20,
    options: ['Soft Silk', 'Banarasi', 'Tussar', 'Linen', 'Kanjivaram', 'Chiffon', 'Georgette', 'Dola Silk', 'Cotton', 'Organza'].map(
      label => ({ label, value: slugify(label), active: true })
    )
  },
  {
    key: 'color',
    label: 'Color',
    show: true,
    source: 'product',
    type: 'list',
    productField: 'color',
    showPills: false,
    sortOrder: 30,
    options: FILTER_COLORS.map(label => ({ label, value: slugify(label), active: true }))
  },
  {
    key: 'craft',
    label: 'Craft & Weave',
    show: true,
    source: 'static',
    type: 'list',
    productField: 'craft',
    showPills: false,
    sortOrder: 40,
    options: FILTER_CRAFTS.map(label => ({ label, value: slugify(label), active: true }))
  },
  {
    key: 'occasion',
    label: 'Occasion',
    show: true,
    source: 'static',
    type: 'list',
    productField: 'occasion',
    showPills: false,
    sortOrder: 50,
    options: ['Wedding', 'Engagement', 'Navratri', 'Party', 'Festive', 'Traditional', 'Daily Wear'].map(label => ({
      label,
      value: slugify(label),
      active: true
    }))
  },
  {
    key: 'design',
    label: 'Design & Print',
    show: true,
    source: 'static',
    type: 'list',
    productField: 'design',
    showPills: false,
    sortOrder: 60,
    options: ['Floral', 'Geometric', 'Temple', 'Zari Butta', 'Digital Print', 'Block Print', 'Plain'].map(label => ({
      label,
      value: slugify(label),
      active: true
    }))
  },
  {
    key: 'style',
    label: 'More Styles',
    show: true,
    source: 'static',
    type: 'list',
    productField: 'style',
    showPills: false,
    sortOrder: 70,
    options: ['Chaniya Choli', 'Lehenga', 'Kurti', 'Dress'].map(label => ({
      label,
      value: slugify(label),
      active: true
    }))
  }
]

export const getProductFilterValue = (product: StoreProduct, field: FilterKey) => {
  if (field === 'price') return String(product.sellingPrice || product.rentPrice || product.price)
  if (field === 'fabric') return product.fabric || ''
  if (field === 'occasion') return product.occasion || ''
  if (field === 'color')
    return product.color || FILTER_COLORS.find(color => product.title.toLowerCase().includes(color.toLowerCase())) || ''
  if (field === 'craft') {
    if (product.craft) return product.craft
    const hay = `${product.title} ${product.collections.join(' ')}`.toLowerCase()

    return FILTER_CRAFTS.find(item => hay.includes(item.toLowerCase())) || ''
  }
  if (field === 'design') {
    if (product.design) return product.design
    const hay = product.title.toLowerCase()
    if (hay.includes('floral')) return 'Floral'
    if (hay.includes('geometric') || hay.includes('zigzag')) return 'Geometric'
    if (hay.includes('temple')) return 'Temple'
    if (hay.includes('block')) return 'Block Print'
    if (hay.includes('print')) return 'Digital Print'
    if (hay.includes('butta') || hay.includes('zari')) return 'Zari Butta'

    return ''
  }
  if (field === 'style') return product.style || 'Chaniya Choli'

  return ''
}

export const optionMatchesProduct = (product: StoreProduct, field: FilterKey, option: FilterOption) => {
  if (field === 'price') {
    const min = option.min ?? Number(option.value.split('-')[0])
    const max = option.max ?? Number(option.value.split('-')[1])
    const prices = [product.sellingPrice, product.rentPrice, product.price].filter((value): value is number => typeof value === 'number' && value > 0)

    return prices.some(value => value >= min && value <= max)
  }

  const raw = getProductFilterValue(product, field)
  if (!raw) return false

  return slugify(raw) === slugify(option.value) || raw.toLowerCase().includes(option.label.toLowerCase()) || option.label.toLowerCase().includes(raw.toLowerCase())
}
