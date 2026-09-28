export type ProductBadge = 'Trending' | 'New' | 'Best seller' | 'BNG'

export type StoreProduct = {
  slug: string
  title: string
  price: number
  sellingPrice?: number
  rentPrice?: number
  listingType?: 'sale' | 'rent' | 'both'
  description?: string
  seoTitle?: string
  seoDescription?: string
  sellingMrp?: number
  rentMrp?: number
  compareAt?: number
  rating: number
  reviews: number
  badge?: ProductBadge
  fabric?: string
  occasion?: string
  color?: string
  craft?: string
  design?: string
  style?: string
  styles?: string[]
  details?: { label: string; value: string }[]
  category: 'saree' | 'lehenga' | 'kurti' | 'dress'
  collections: string[]
  image: string
  images?: string[]
  imageAlt?: string
  stock?: number
  status?: 'active' | 'inactive'
  googleReviews?: boolean
}

export type NavColumn = {
  title: string
  links: { label: string; href: string }[]
}

export const announcementSlides = [
  'Shipping Worldwide',
  'COD across India',
  'Easy Return & Exchange*'
]

export const navItems: {
  label: string
  href: string
  columns?: NavColumn[]
}[] = [
  {
    label: 'Shop',
    href: '/collections/all',
    columns: [
      {
        title: 'Shop by Weave',
        links: [
          { label: 'Banarasi', href: '/collections/banarasi' },
          { label: 'Kanjivaram', href: '/collections/kanjivaram' },
          { label: 'Gadwal', href: '/collections/gadwal' },
          { label: 'Paithani', href: '/collections/paithani' },
          { label: 'Pochampally', href: '/collections/pochampally' }
        ]
      },
      {
        title: 'Shop by Craft',
        links: [
          { label: 'Kalamkari', href: '/collections/kalamkari' },
          { label: 'Ajrakh', href: '/collections/ajrakh' },
          { label: 'Bagru', href: '/collections/bagru' },
          { label: 'Batik', href: '/collections/batik' },
          { label: 'Bandhani', href: '/collections/bandhani' }
        ]
      },
      {
        title: 'Shop by Occasion',
        links: [
          { label: 'Wedding', href: '/collections/wedding' },
          { label: 'Festive', href: '/collections/festive' },
          { label: 'Party', href: '/collections/party' },
          { label: 'Office', href: '/collections/office' },
          { label: 'Daily Wear', href: '/collections/daily-wear' }
        ]
      },
      {
        title: 'Shop by Price',
        links: [
          { label: 'Under ₹999', href: '/collections/under-999' },
          { label: '₹1,000 – ₹1,499', href: '/collections/1000-1499' },
          { label: '₹1,500 – ₹1,999', href: '/collections/1500-1999' },
          { label: 'Premium ₹2,000+', href: '/collections/premium' }
        ]
      }
    ]
  },
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  {
    label: 'Craft Stories',
    href: '/craft-stories',
    columns: [
      {
        title: 'Story Of India Hidden Gems',
        links: [
          { label: 'View All', href: '/craft-stories' },
          { label: 'Ajrakh', href: '/collections/ajrakh' },
          { label: 'Baagh', href: '/collections/baagh' },
          { label: 'Bagru', href: '/collections/bagru' },
          { label: 'Batik', href: '/collections/batik' },
          { label: 'Dabu', href: '/collections/dabu' },
          { label: 'Kalamkari', href: '/collections/kalamkari' },
          { label: 'Sanganeri', href: '/collections/sanganeri' },
          { label: 'Chikankari', href: '/collections/chikankari' },
          { label: 'Gotapatti', href: '/collections/gotapatti' },
          { label: 'Hand Embroidery', href: '/collections/embroidered' },
          { label: 'Brocade', href: '/collections/brocade' },
          { label: 'Ikat', href: '/collections/ikat' },
          { label: 'Jamdani', href: '/collections/jamdani' },
          { label: 'Tanchoi', href: '/collections/tanchoi' },
          { label: 'Handloom', href: '/collections/handloom' },
          { label: 'Bandhani', href: '/collections/bandhani' },
          { label: 'Leheriya', href: '/collections/leheriya' },
          { label: 'Shibori', href: '/collections/shibori' }
        ]
      }
    ]
  },
  {
    label: 'Popup Shop',
    href: '/popup-shop',
    columns: [
      {
        title: 'Popup Shop',
        links: [
          { label: 'Sunita Shetty', href: '/popup-shop/sunita-shetty' },
          { label: 'Palak Bhagvati', href: '/popup-shop/palak-bhagvati' },
          { label: 'Jhanvi Chauhan', href: '/popup-shop/jhanvi-chauhan' },
          { label: 'Drashti Ghanva', href: '/popup-shop/drashti-ghanva' },
          { label: 'Shivani Pandya', href: '/popup-shop/shivani-pandya' },
          { label: 'Sunitha Sharma', href: '/popup-shop/sunitha-sharma' },
          { label: 'View All', href: '/popup-shop' }
        ]
      }
    ]
  },
  {
    label: 'Dresses',
    href: '/collections/dresses',
    columns: [
      {
        title: 'Dresses',
        links: [
          { label: 'Long Dress', href: '/collections/long-dress' },
          { label: 'Midi Dress', href: '/collections/midi-dress' },
          { label: 'Maxi Dress', href: '/collections/maxi-dress' },
          { label: 'Ethnic Dress', href: '/collections/ethnic-dress' },
          { label: 'Kurta Set', href: '/collections/kurta-set' }
        ]
      }
    ]
  },
  {
    label: 'Accs',
    href: '/collections/accessories',
    columns: [
      {
        title: 'Accessories',
        links: [
          { label: 'Scarfs', href: '/collections/scarfs' },
          { label: 'Dupatta', href: '/collections/dupatta' },
          { label: 'Lehanga', href: '/collections/lehenga' }
        ]
      }
    ]
  },
  { label: 'Handpicked', href: '/collections/handpicked' },
  { label: 'Under ₹ 999', href: '/collections/under-999' },
  { label: 'Big Sale', href: '/collections/big-sale' },
  { label: 'Video', href: '/video' }
]

const storeImages = [
  'photo-1610030469983-98e550d6193c',
  'photo-1594633312681-425c7b97ccd1',
  'photo-1515886657613-9f3515b0c78f',
  'photo-1524504388940-b1c1722653e1',
  'photo-1490481651871-ab68de25d43d',
  'photo-1515372039744-b8f02a3ae446',
  'photo-1502716119720-b23a93e5fe1b',
  'photo-1469334031218-e382a71b716b',
  'photo-1496747611176-843222e1e57c',
  'photo-1487412947147-5cebf100ffc2'
]

let imageIndex = 0

const img = (_id?: string) => {
  const id = storeImages[imageIndex++ % storeImages.length]

  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`
}

export const products: StoreProduct[] = [
  {
    slug: 'soft-silk-colourblock-zari-weaving-saree',
    title: 'Soft Silk Colourblock Zari Weaving',
    price: 1695,
    rating: 5,
    reviews: 14,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', 'best-sellers', 'handpicked', '1500-1999'],
    image: img('photo-1610030469983-98e550d6193c')
  },
  {
    slug: 'black-soft-silk-geometric-zigzag-zari-saree',
    title: 'Black Soft Silk Geometric Zigzag Zari',
    price: 1695,
    rating: 5,
    reviews: 15,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', '1500-1999'],
    image: img('photo-1583391733956-6c7821694dd9')
  },
  {
    slug: 'classic-soft-silk-woven-temple-saree',
    title: 'Classic Soft Silk Woven Temple',
    price: 1695,
    rating: 5,
    reviews: 16,
    badge: 'BNG',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', 'kanjivaram', '1500-1999'],
    image: img('photo-1596484552834-6a58f850bb0b')
  },
  {
    slug: 'ikkat-paithani-fusion-tussar-manipuri-saree',
    title: 'Ikkat Paithani Fusion Tussar Manipuri',
    price: 999,
    rating: 5,
    reviews: 12,
    badge: 'New',
    fabric: 'Tussar',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', 'under-999', 'ikat', 'paithani', 'big-sale'],
    image: img('photo-1617627143750-d86bc21e42bb')
  },
  {
    slug: 'red-pure-cotton-viscose-kalamkari-print-saree',
    title: 'Red Pure Cotton Viscose Kalamkari Print',
    price: 1250,
    compareAt: 3545,
    rating: 4.8,
    reviews: 15,
    badge: 'Best seller',
    fabric: 'Viscose',
    occasion: 'Traditional',
    category: 'saree',
    collections: ['sarees', 'kalamkari', 'best-sellers', '1000-1499', 'big-sale'],
    image: img('photo-1610030469468-14b0ba6e38c7')
  },
  {
    slug: 'stylish-gold-woven-pallu-contrast-border-saree',
    title: 'Stylish Gold Woven Pallu Contrast Border',
    price: 1695,
    rating: 5,
    reviews: 14,
    badge: 'New',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', 'banarasi', '1500-1999'],
    image: img('photo-1609102026405-8d0730cba623')
  },
  {
    slug: 'black-sona-chandi-weave-katan-silk-saree',
    title: 'Black Sona Chandi Weave Katan Silk',
    price: 1250,
    compareAt: 3545,
    rating: 4.8,
    reviews: 17,
    badge: 'New',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'banarasi', '1000-1499', 'big-sale'],
    image: img('photo-1594633313593-bab3825d0caf')
  },
  {
    slug: 'red-mul-cotton-kalamkari-block-print-saree',
    title: 'Red Mul Cotton Kalamkari Block Print',
    price: 1250,
    rating: 5,
    reviews: 14,
    badge: 'New',
    fabric: 'Cotton Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'kalamkari', '1000-1499'],
    image: img('photo-1572804013309-59a88b7e9202')
  },
  {
    slug: 'elegant-tussar-brasso-digital-print-saree',
    title: 'Elegant Tussar Brasso Digital Print',
    price: 1450,
    rating: 4.9,
    reviews: 18,
    fabric: 'Tussar',
    occasion: 'Traditional',
    category: 'saree',
    collections: ['sarees', 'handpicked', '1000-1499'],
    image: img('photo-1595777457583-95e059d581b8')
  },
  {
    slug: 'classic-kanchi-rudraksha-zari-butta-saree',
    title: 'Classic Kanchi Rudraksha Zari Butta',
    price: 1695,
    rating: 5,
    reviews: 19,
    badge: 'BNG',
    occasion: 'Traditional',
    category: 'saree',
    collections: ['sarees', 'kanjivaram', 'wedding', '1500-1999'],
    image: img('photo-1617038260897-41a1f14a8ca0')
  },
  {
    slug: 'green-swan-motif-soft-silk-saree',
    title: 'Green Swan Motif Soft Silk',
    price: 1695,
    compareAt: 3545,
    rating: 4.8,
    reviews: 24,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'festive', 'best-sellers', '1500-1999', 'big-sale'],
    image: img('photo-1524504388940-b1c1722653e1')
  },
  {
    slug: 'chiffon-striped-print-diamond-work-saree',
    title: 'Chiffon Striped Print Diamond Work',
    price: 1050,
    rating: 5,
    reviews: 14,
    fabric: 'Poly Chiffon',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'party', '1000-1499'],
    image: img('photo-1515886657613-9f3515b0c78f')
  },
  {
    slug: 'regal-purple-soft-silk-ikkat-saree',
    title: 'Regal Purple Soft Silk Ikkat',
    price: 1695,
    compareAt: 3545,
    rating: 4.9,
    reviews: 25,
    badge: 'Trending',
    fabric: 'Tissue',
    occasion: 'Traditional',
    category: 'saree',
    collections: ['sarees', 'ikat', 'pochampally', '1500-1999', 'big-sale'],
    image: img('photo-1496747611176-843222e1e57c')
  },
  {
    slug: 'elegant-diamond-work-chiffon-saree',
    title: 'Elegant Diamond Work Chiffon',
    price: 1050,
    rating: 5,
    reviews: 12,
    badge: 'BNG',
    fabric: 'Poly Chiffon',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'party', '1000-1499'],
    image: img('photo-1487412947147-5cebf100ffc2')
  },
  {
    slug: 'royal-soft-silk-striped-pattern-saree',
    title: 'Royal Soft Silk Striped Pattern',
    price: 1695,
    rating: 5,
    reviews: 15,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'gadwal', '1500-1999'],
    image: img('photo-1469334031218-e382a71b716b')
  },
  {
    slug: 'elegant-shiny-silk-striped-print-saree',
    title: 'Elegant Shiny Silk Striped Print',
    price: 1495,
    rating: 5,
    reviews: 13,
    badge: 'Trending',
    fabric: 'Art Silk',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', '1000-1499'],
    image: img('photo-1485968579580-b6d449e32b03')
  },
  {
    slug: 'admiral-blue-kalamkari-lehenga-set',
    title: 'Admiral Blue Kalamkari Lehenga Set',
    price: 5545,
    occasion: 'Traditional',
    rating: 5,
    reviews: 8,
    category: 'lehenga',
    collections: ['lehenga', 'kalamkari', 'wedding', 'premium'],
    image: img('photo-1595475878902-6d0388624c21')
  },
  {
    slug: 'traditions-kalamkari-lehenga-set',
    title: 'Traditions Kalamkari Lehenga Set',
    price: 5545,
    occasion: 'Traditional',
    rating: 4.9,
    reviews: 6,
    category: 'lehenga',
    collections: ['lehenga', 'kalamkari', 'wedding', 'premium'],
    image: img('photo-1617077644557-64be144aa306')
  },
  {
    slug: 'heritage-kalamkari-lehenga-set',
    title: 'Heritage Kalamkari Lehenga Set',
    price: 5545,
    occasion: 'Traditional',
    rating: 5,
    reviews: 4,
    category: 'lehenga',
    collections: ['lehenga', 'kalamkari', 'wedding', 'premium'],
    image: img('photo-1601925260368-ae2f176ab65f')
  },
  {
    slug: 'tharini-kalamkari-lehenga-set',
    title: 'Tharini Kalamkari Lehenga Set',
    price: 5545,
    occasion: 'Traditional',
    rating: 4.8,
    reviews: 3,
    category: 'lehenga',
    collections: ['lehenga', 'kalamkari', 'wedding', 'premium'],
    stock: 1,
    image: img('photo-1566174053879-315285779f1c')
  },
  {
    slug: 'off-white-ethnic-motif-silk-blend-saree',
    title: 'Off White Ethnic Motif Silk Blend',
    price: 1995,
    compareAt: 3545,
    rating: 4.9,
    reviews: 96,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Traditional',
    category: 'saree',
    collections: ['sarees', 'best-sellers', '1500-1999', 'handloom'],
    image: img('photo-1521572163474-6864f9cf17ab')
  },
  {
    slug: 'eye-catching-gadwal-pure-soft-silk-saree',
    title: 'Eye-Catching Gadwal Pure Soft Silk Festive Wear',
    price: 1695,
    compareAt: 5445,
    rating: 4.8,
    reviews: 225,
    badge: 'Trending',
    fabric: 'Silk Blend',
    occasion: 'Festive',
    category: 'saree',
    collections: ['sarees', 'gadwal', 'best-sellers', '1500-1999', 'big-sale'],
    image: img('photo-1544441893-675973e31985')
  },
  {
    slug: 'opulent-kalamkari-overlap-neck-kurti',
    title: 'Opulent Kalamkari Overlap Neck Kurti',
    price: 999,
    rating: 4.4,
    reviews: 10,
    occasion: 'Work',
    category: 'kurti',
    collections: ['office', 'kalamkari', 'under-999', 'kurta-set', 'daily-wear'],
    image: img('photo-1617137984095-74e4e5e3613f')
  },
  {
    slug: 'kalamkari-boat-neck-mul-kurti',
    title: 'Kalamkari Boat Neck Mul Kurti',
    price: 999,
    rating: 5,
    reviews: 12,
    occasion: 'Work',
    category: 'kurti',
    collections: ['office', 'kalamkari', 'under-999'],
    image: img('photo-1434389677669-e08b4cac3105')
  },
  {
    slug: 'persian-blue-abstract-print-dress',
    title: 'Persian Blue Abstract Print Dress',
    price: 2595,
    rating: 4.7,
    reviews: 31,
    fabric: 'Poly Georgette',
    occasion: 'Festive',
    category: 'dress',
    collections: ['dresses', 'party', 'long-dress', 'ethnic-dress', 'premium'],
    image: img('photo-1595777457583-95e059d581b8')
  },
  {
    slug: 'rose-pink-floral-printed-dress',
    title: 'Rose Pink Floral Printed Dress',
    price: 2545,
    rating: 4.6,
    reviews: 35,
    occasion: 'Festive',
    category: 'dress',
    collections: ['dresses', 'midi-dress', 'party', 'premium'],
    image: img('photo-1515372039744-b8f02a3ae446')
  },
  {
    slug: 'sky-blue-floral-print-dress',
    title: 'Sky Blue Floral Print Dress',
    price: 2575,
    rating: 4.5,
    reviews: 42,
    fabric: 'Poly Georgette',
    occasion: 'Festive',
    category: 'dress',
    collections: ['dresses', 'maxi-dress', 'premium'],
    image: img('photo-1502716119720-b23a93e5fe1b')
  },
  {
    slug: 'blossom-pink-midi-delight',
    title: 'Blossom Pink Midi Delight',
    price: 1545,
    rating: 4.8,
    reviews: 4,
    fabric: 'Kota',
    occasion: 'Festive',
    category: 'dress',
    collections: ['dresses', 'midi-dress', '1500-1999'],
    image: img('photo-1490481651871-ab68de25d43d')
  }
]

export const craftCollections = [
  'Ajrakh',
  'Bagru',
  'Banarasi',
  'Brocade',
  'Baagh',
  'Bandhani',
  'Batik',
  'Chikankari',
  'Dabu',
  'Gotapatti',
  'Embroidered',
  'Handloom',
  'Ikat',
  'Dhakai Jamdani',
  'Kalamkari',
  'Leheriya',
  'Shibori',
  'Tanchoi'
]

export const occasions = [
  { title: 'Haldi', href: '/collections/haldi' },
  { title: 'Mehendi', href: '/collections/mehendi' },
  { title: 'Sangeet', href: '/collections/sangeet' },
  { title: 'Cocktail', href: '/collections/cocktail' },
  { title: 'Wedding', href: '/collections/wedding' },
  { title: 'Engagement', href: '/collections/engagement' },
  { title: 'New Arrivals', href: '/collections/all' }
]

export const collectionTitles: Record<string, string> = {
  sarees: 'All Products',
  all: 'All Products',
  'all-products': 'All Products',
  'best-sellers': 'Best Sellers',
  'under-999': 'Under ₹999',
  'big-sale': 'Big Sale',
  dresses: 'Dresses',
  handpicked: 'Handpicked',
  kalamkari: 'Kalamkari',
  ajrakh: 'Ajrakh',
  bagru: 'Bagru',
  batik: 'Batik',
  bandhani: 'Bandhani',
  banarasi: 'Banarasi',
  kanjivaram: 'Kanjivaram',
  gadwal: 'Gadwal',
  paithani: 'Paithani',
  pochampally: 'Pochampally',
  wedding: 'Wedding',
  haldi: 'Haldi',
  mehendi: 'Mehendi',
  sangeet: 'Sangeet',
  cocktail: 'Cocktail',
  festive: 'Festive',
  party: 'Party',
  engagement: 'Engagement',
  navratri: 'Navratri',
  'latest-trend': 'Latest Trend',
  office: 'Office Wear',
  'daily-wear': 'Daily Wear',
  '1000-1499': '₹1,000 – ₹1,499',
  '1500-1999': '₹1,500 – ₹1,999',
  premium: 'Premium ₹2,000+',
  lehenga: 'Lehanga',
  baagh: 'Baagh',
  dabu: 'Dabu',
  sanganeri: 'Sanganeri',
  chikankari: 'Chikankari',
  gotapatti: 'Gotapatti',
  embroidered: 'Hand Embroidery',
  brocade: 'Brocade',
  ikat: 'Ikat',
  jamdani: 'Jamdani',
  tanchoi: 'Tanchoi',
  handloom: 'Handloom',
  leheriya: 'Leheriya',
  shibori: 'Shibori',
  'long-dress': 'Long Dress',
  'midi-dress': 'Midi Dress',
  'maxi-dress': 'Maxi Dress',
  'ethnic-dress': 'Ethnic Dress',
  'kurta-set': 'Kurta Set',
  accessories: 'Accessories',
  scarfs: 'Scarfs',
  dupatta: 'Dupatta',
  gifting: 'Gifting'
}

export { withoutSareeWord } from '@/libs/public-label'

export const slugifyCollection = (label: string) =>
  label
    .toLowerCase()
    .replace(/sarees?/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'all'

export const htmlToText = (html: string) =>
  String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const sanitizeHtml = (html: string) =>
  String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')

export const formatPrice = (value: number) =>
  `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const discountPercent = (mrp?: number, price?: number) => {
  if (!mrp || !price || mrp <= price) return 0

  return Math.round(((mrp - price) / mrp) * 100)
}

export const getProduct = (slug: string) => products.find(item => item.slug === slug)

export const getCollectionProducts = (slug: string) => {
  if (slug === 'under-999') return products.filter(item => item.price <= 999)
  if (slug === '1000-1499') return products.filter(item => item.price >= 1000 && item.price <= 1499)
  if (slug === '1500-1999') return products.filter(item => item.price >= 1500 && item.price <= 1999)
  if (slug === 'premium') return products.filter(item => item.price >= 2000)
  if (slug === 'best-sellers') return products.filter(item => item.badge === 'Best seller' || item.reviews >= 20)
  if (slug === 'big-sale') return products.filter(item => Boolean(item.compareAt))
  if (slug === 'accessories' || slug === 'scarfs' || slug === 'dupatta') return products.filter(item => item.category === 'dress').slice(0, 4)
  if (slug === 'gifting') return products.filter(item => item.category === 'saree').slice(0, 8)

  const matched = products.filter(item => item.collections.includes(slug) || item.category === slug)

  return matched.length ? matched : products
}

export const graceInBloom = products.slice(0, 8)
export const spotlight = products.slice(8, 16)
export const celebrationEdit = products.filter(item => item.category === 'lehenga')
export const threadsOfTradition = products.filter(item => item.category === 'saree').slice(8, 16)
export const rootedInCulture = products.filter(item => item.category === 'kurti')
export const minimalMagic = products.filter(item => item.category === 'dress')
