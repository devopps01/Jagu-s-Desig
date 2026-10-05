export type HomeItem = {
  id: string
  enabled: boolean
  showKicker: boolean
  kicker: string
  showTitle: boolean
  title: string
  showText: boolean
  text: string
  showButton: boolean
  buttonLabel: string
  href: string
  showSecondButton: boolean
  secondLabel: string
  secondHref: string
  image: string
  /** Mobile / Android image. If empty, desktop `image` is used on phones too. */
  imageMobile: string
  icon: string
}

export type HomeSectionType = 'hero' | 'trust' | 'products' | 'cards' | 'video' | 'story' | 'features' | 'festivities' | 'fan' | 'navratri' | 'reviews'

export type HomeSection = {
  id: string
  type: HomeSectionType
  enabled: boolean
  showTitle: boolean
  title: string
  showNote: boolean
  note: string
  showButton: boolean
  buttonLabel: string
  href: string
  showText: boolean
  text: string
  image: string
  /** Mobile / Android image for section-level media (video, story). */
  imageMobile: string
  layout: 'slider' | 'grid' | 'occasions' | 'looks'
  productMode: 'filter' | 'selected'
  filterSlug: string
  limit: number
  productSlugs: string[]
  items: HomeItem[]
  locked: boolean
  width: string
  height: string
  gap: string
  padding: string
}

export type HomePageSettings = {
  sections: HomeSection[]
}

const item = (partial: Partial<HomeItem> & Pick<HomeItem, 'id' | 'title'>): HomeItem => ({
  enabled: true,
  showKicker: false,
  kicker: '',
  showTitle: true,
  showText: false,
  text: '',
  showButton: false,
  buttonLabel: '',
  href: '',
  showSecondButton: false,
  secondLabel: '',
  secondHref: '',
  image: '',
  imageMobile: '',
  icon: 'tabler-sparkles',
  ...partial
})

export const createHomeItem = (partial: Partial<HomeItem> = {}): HomeItem =>
  item({
    id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: partial.title || 'New item',
    showText: Boolean(partial.showText),
    showKicker: Boolean(partial.showKicker),
    showButton: Boolean(partial.showButton),
    ...partial
  })

/** Sections where items (slides / cards / icons) are editable. */
export const sectionAllowsItems = (type: HomeSectionType) =>
  type === 'hero' ||
  type === 'trust' ||
  type === 'cards' ||
  type === 'features' ||
  type === 'festivities' ||
  type === 'fan' ||
  type === 'navratri'

export const defaultNavratriItems = (): HomeItem[] => [
  item({
    id: 'nav-story-1',
    showKicker: true,
    kicker: 'Garba nights',
    showTitle: true,
    title: 'Chaniya choli made to move',
    showText: true,
    text: 'Navratri at Jagu’s Designing is cut for the circle. Flared skirts, secure blouses and mirror work that catches every taali.\n\nFrom the first night to the last, the drape stays light enough to dance and rich enough for the photographs.',
    showButton: true,
    buttonLabel: 'Shop Navratri',
    href: '/collections/festive',
    image: '/images/home/home-navratri.png',
    showSecondButton: false
  }),
  item({
    id: 'nav-story-2',
    showKicker: true,
    kicker: 'The atelier',
    showTitle: true,
    title: 'Hand embroidery, nine nights long',
    showText: true,
    text: 'Each piece is embroidered in our Surat atelier — sequins, zari and abhla set by hand so the colour does not fade after a week of garba.\n\nTell us your night, your colour and your comfort. We finish the blouse, the cancan and the dupatta to match.',
    showButton: true,
    buttonLabel: 'Book a styling call',
    href: '/video',
    image: '/images/home/home-craft.png',
    showSecondButton: true
  }),
  item({
    id: 'nav-note-1',
    showTitle: true,
    title: 'For the mandap too',
    showText: true,
    text: 'The same craft that moves at garba is finished heavier for pheras and portraits.',
    image: '/images/home/home-wedding.png',
    href: '/collections/wedding'
  }),
  item({
    id: 'nav-note-2',
    showTitle: true,
    title: 'Pastels for quieter nights',
    showText: true,
    text: 'Ivory, peach and champagne when you want glow without the full festive red.',
    image: '/images/home/home-engagement.png',
    href: '/collections/engagement'
  }),
  item({
    id: 'nav-note-3',
    showTitle: true,
    title: 'After the aarti',
    showText: true,
    text: 'Emerald and gold silhouettes for receptions, dandiya nights and cocktail hours.',
    image: '/images/home/home-party.png',
    href: '/collections/party'
  })
]

export const defaultFanItems = (): HomeItem[] => [
  item({
    id: 'fan-outer-left',
    title: 'Engagement look',
    text: 'Pastel engagement look — side view',
    href: '/collections/engagement',
    image: '/images/home/home-engagement.png',
    showTitle: true
  }),
  item({
    id: 'fan-inner-left',
    title: 'Party look',
    text: 'Festive party chaniya choli — full look',
    href: '/collections/party',
    image: '/images/home/home-party.png',
    showTitle: true
  }),
  item({
    id: 'fan-center',
    title: 'Navratri look',
    text: 'Signature festive look — front portrait',
    href: '/collections/festive',
    image: '/images/home/home-navratri.png',
    showTitle: true
  }),
  item({
    id: 'fan-inner-right',
    title: 'Bridal edit',
    text: 'Bridal edit — ceremony silhouette',
    href: '/collections/wedding',
    image: '/images/home/home-wedding.png',
    showTitle: true
  }),
  item({
    id: 'fan-outer-right',
    title: 'Craft detail',
    text: 'Handcrafted embroidery detail look',
    href: '/collections/festive',
    image: '/images/home/home-craft.png',
    showTitle: true
  })
]

export const defaultFestivityItems = (): HomeItem[] => [
  item({
    id: 'fest-wedding',
    title: 'Wedding',
    text: 'Ceremony silhouettes in wine & gold',
    href: '/collections/wedding',
    image: '/images/home/home-wedding.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  }),
  item({
    id: 'fest-engagement',
    title: 'Engagement',
    text: 'Soft pastels for the ring exchange',
    href: '/collections/engagement',
    image: '/images/home/home-engagement.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  }),
  item({
    id: 'fest-haldi',
    title: 'Haldi',
    text: 'Bright yellows made to move',
    href: '/collections/haldi',
    image: '/images/home/home-navratri.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  }),
  item({
    id: 'fest-mehendi',
    title: 'Mehendi',
    text: 'Colourful looks for the mehendi night',
    href: '/collections/mehendi',
    image: '/images/home/home-party.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  }),
  item({
    id: 'fest-sangeet',
    title: 'Sangeet',
    text: 'Mirror work ready for the dance floor',
    href: '/collections/sangeet',
    image: '/images/home/home-craft.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  }),
  item({
    id: 'fest-cocktail',
    title: 'Cocktail',
    text: 'Statement looks for the party night',
    href: '/collections/cocktail',
    image: '/images/home/home-hero.png',
    showTitle: true,
    showButton: true,
    buttonLabel: 'Shop'
  })
]

const section = (partial: Partial<HomeSection> & Pick<HomeSection, 'id' | 'type' | 'title'>): HomeSection => ({
  enabled: true,
  showTitle: true,
  showNote: true,
  note: '',
  showButton: false,
  buttonLabel: 'View all',
  href: '',
  showText: true,
  text: '',
  image: '',
  imageMobile: '',
  layout: 'slider',
  productMode: 'filter',
  filterSlug: 'latest',
  limit: 8,
  productSlugs: [],
  items: [],
  locked: true,
  width: '',
  height: '',
  gap: '',
  padding: '',
  ...partial
})

export const cssSize = (value?: string) => {
  const raw = String(value || '').trim()

  if (!raw) return undefined
  if (/^\d+(\.\d+)?$/.test(raw)) return `${raw}px`

  return raw
}

export type HomeSectionMeta = {
  type: HomeSectionType
  label: string
  icon: string
  hint: string
}

export const HOME_SECTION_TYPES: HomeSectionMeta[] = [
  { type: 'hero', label: 'Hero', icon: 'tabler-photo', hint: 'Top banner' },
  { type: 'trust', label: 'Trust', icon: 'tabler-shield-check', hint: 'Icon row' },
  { type: 'products', label: 'Products', icon: 'tabler-shopping-bag', hint: 'Grid / slider' },
  { type: 'cards', label: 'Cards', icon: 'tabler-layout-grid', hint: 'Image links' },
  { type: 'video', label: 'Video', icon: 'tabler-video', hint: 'Call banner' },
  { type: 'story', label: 'Story', icon: 'tabler-book', hint: 'Text + image' },
  { type: 'features', label: 'Services', icon: 'tabler-sparkles', hint: 'Icon list' },
  { type: 'festivities', label: 'Festivities', icon: 'tabler-flame', hint: 'Photo carousel' },
  { type: 'fan', label: 'Fan', icon: 'tabler-stack-2', hint: 'Fan photos' },
  { type: 'navratri', label: 'Navratri', icon: 'tabler-moon-stars', hint: 'Story rows' },
  { type: 'reviews', label: 'Reviews', icon: 'tabler-star', hint: 'Google reviews' }
]

export const homeSectionMeta = (type: HomeSectionType): HomeSectionMeta =>
  HOME_SECTION_TYPES.find(item => item.type === type) || HOME_SECTION_TYPES[0]

export const createHomeSection = (type: HomeSectionType): HomeSection => {
  const label = HOME_SECTION_TYPES.find(itemRow => itemRow.type === type)?.label || 'Section'
  const needsItems =
    type === 'hero' ||
    type === 'cards' ||
    type === 'features' ||
    type === 'trust' ||
    type === 'festivities' ||
    type === 'fan' ||
    type === 'navratri'

  return section({
    id: `${type}-${Date.now().toString(36)}`,
    type,
    title:
      type === 'festivities'
        ? 'Pre Wedding Festivities'
        : type === 'fan'
          ? 'Navratri Favourites'
          : type === 'navratri'
            ? 'Navratri, from the atelier'
            : label,
    note:
      type === 'festivities'
        ? 'Styled for every function before the big day'
        : type === 'fan'
          ? 'Current most trending requirement'
          : type === 'navratri'
            ? 'Image, craft and the nine nights'
            : '',
    showText: true,
    text: type === 'navratri' ? 'Beyond the garba circle' : '',
    locked: false,
    showButton: type === 'products' || type === 'video' || type === 'story',
    buttonLabel: type === 'navratri' ? 'Wedding, engagement and after-aarti looks' : 'View all',
    href: type === 'products' ? '/collections' : type === 'fan' ? '/collections/festive' : '',
    layout: type === 'cards' ? 'grid' : type === 'products' ? 'slider' : 'slider',
    items:
      type === 'festivities'
        ? defaultFestivityItems()
        : type === 'fan'
          ? defaultFanItems()
          : type === 'navratri'
            ? defaultNavratriItems()
            : needsItems
              ? [
                  createHomeItem({
                    title: 'New item',
                    showText: type === 'features' || type === 'hero',
                    showKicker: type === 'hero',
                    showButton: type === 'hero' || type === 'cards'
                  })
                ]
              : []
  })
}

export const HOME_FILTERS = [
  { slug: 'latest', label: 'Latest products', hint: 'Newest items first' },
  { slug: 'all', label: 'All products', hint: 'Whole catalog' },
  { slug: 'trending', label: 'Trending', hint: 'Marked trending in admin' },
  { slug: 'festive', label: 'Navratri / festive', hint: 'Garba & festive looks' },
  { slug: 'wedding', label: 'Wedding', hint: 'Wedding wear' },
  { slug: 'engagement', label: 'Engagement', hint: 'Engagement looks' },
  { slug: 'party', label: 'Party', hint: 'Party & evening' },
  { slug: 'bandhani', label: 'Bandhani', hint: 'Bandhani craft' },
  { slug: 'best-sellers', label: 'Most selling / Best sellers', hint: 'Marked best seller in admin' },
  { slug: 'embroidered', label: 'Hand embroidery', hint: 'Embroidered pieces' },
  { slug: 'office', label: 'Office', hint: 'Office wear' },
  { slug: 'daily-wear', label: 'Daily wear', hint: 'Everyday looks' }
]

export const defaultHomePageSettings = (): HomePageSettings => ({
  sections: [
    section({
      id: 'hero',
      type: 'hero',
      title: 'Hero banner',
      showTitle: false,
      items: [
        item({
          id: 'hero-1',
          title: 'Tradition, tailored for today',
          showKicker: true,
          kicker: 'Jagu’s Designing',
          showText: true,
          text: 'Handcrafted chaniya choli for Navratri, weddings and celebrations.',
          showButton: true,
          buttonLabel: 'Shop collection',
          href: '/collections/all',
          showSecondButton: true,
          secondLabel: 'Shop on video',
          secondHref: '/video',
          image: '/images/home/home-hero.png'
        }),
        item({
          id: 'hero-2',
          title: 'Made to move at Garba',
          showKicker: true,
          kicker: 'Navratri edit',
          showText: true,
          text: 'Mirror work chaniya choli for nine nights of colour and dance.',
          showButton: true,
          buttonLabel: 'Shop Navratri',
          href: '/collections/festive',
          image: '/images/home/home-navratri.png'
        })
      ]
    }),
    section({
      id: 'trust',
      type: 'trust',
      title: 'Trust bar',
      showTitle: false,
      items: [
        item({ id: 'trust-1', title: 'Pan-India shipping', icon: 'tabler-truck' }),
        item({ id: 'trust-2', title: 'Cash on delivery', icon: 'tabler-cash' }),
        item({ id: 'trust-3', title: 'Easy exchange', icon: 'tabler-refresh' }),
        item({ id: 'trust-4', title: 'Hand embroidered', icon: 'tabler-sparkles' })
      ]
    }),
    section({
      id: 'occasions',
      type: 'cards',
      title: 'Shop by occasion',
      note: 'Styled for every celebration',
      layout: 'occasions',
      showButton: true,
      buttonLabel: 'View more',
      limit: 8,
      items: [
        item({ id: 'occ-1', title: 'Navratri', href: '/collections/festive', image: '/images/home/home-navratri.png', showTitle: true }),
        item({ id: 'occ-2', title: 'Wedding', href: '/collections/wedding', image: '/images/home/home-wedding.png', showTitle: true }),
        item({ id: 'occ-3', title: 'Engagement', href: '/collections/engagement', image: '/images/home/home-engagement.png', showTitle: true }),
        item({ id: 'occ-4', title: 'Party', href: '/collections/party', image: '/images/home/home-party.png', showTitle: true })
      ]
    }),
    section({
      id: 'looks',
      type: 'cards',
      title: 'Looks',
      showTitle: false,
      layout: 'looks',
      items: [
        item({
          id: 'look-1',
          title: 'Garba nights',
          showText: true,
          text: 'Mirror work made to move',
          href: '/collections/festive',
          image: '/images/home/home-navratri.png'
        }),
        item({
          id: 'look-2',
          title: 'Bridal edit',
          showText: true,
          text: 'Wine, gold and ceremony',
          href: '/collections/wedding',
          image: '/images/home/home-wedding.png'
        })
      ]
    }),
    section({
      id: 'festivities',
      type: 'festivities',
      title: 'Pre Wedding Festivities',
      note: 'Styled for every function before the big day',
      items: defaultFestivityItems()
    }),
    section({
      id: 'trending',
      type: 'products',
      title: 'Trending',
      note: 'What everyone is looking at right now',
      showButton: true,
      buttonLabel: 'View all trending',
      href: '/collections/trending',
      layout: 'slider',
      productMode: 'filter',
      filterSlug: 'trending',
      limit: 12
    }),
    section({
      id: 'best-sellers',
      type: 'products',
      title: 'Most Selling',
      note: 'Our most loved chaniya choli',
      showButton: true,
      buttonLabel: 'View all best sellers',
      href: '/collections/best-sellers',
      layout: 'slider',
      productMode: 'filter',
      filterSlug: 'best-sellers',
      limit: 12
    }),
    section({
      id: 'fan',
      type: 'fan',
      title: 'Navratri Favourites',
      note: 'Current most trending requirement',
      href: '/collections/festive',
      items: defaultFanItems()
    }),
    section({
      id: 'arrivals',
      type: 'products',
      title: 'New arrivals',
      note: 'Fresh from the atelier',
      showButton: true,
      buttonLabel: 'View all',
      href: '/collections/all',
      layout: 'grid',
      productMode: 'filter',
      filterSlug: 'latest',
      limit: 8
    }),
    section({
      id: 'video',
      type: 'video',
      title: 'Video Call',
      note: 'Private atelier · Live styling',
      showText: true,
      text: 'Experience the luxury of our bespoke services for any occasion',
      showButton: true,
      buttonLabel: 'Book a session',
      href: '/video',
      image: '/images/home/home-video.png'
    }),
    section({
      id: 'story',
      type: 'story',
      title: 'Craft you can feel in every fold',
      note: 'Our atelier',
      showText: true,
      text: 'Jagu’s Designing is a Surat-born house of chaniya choli. Each piece is cut, embroidered and finished so the drape, the mirror work and the colour stay true.',
      showButton: true,
      buttonLabel: 'Know more about us',
      href: '/about',
      image: '/images/home/home-craft.png'
    }),
    section({
      id: 'navratri',
      type: 'navratri',
      title: 'Navratri, from the atelier',
      note: 'Image, craft and the nine nights',
      showText: true,
      text: 'Beyond the garba circle',
      buttonLabel: 'Wedding, engagement and after-aarti looks',
      items: defaultNavratriItems()
    }),
    section({ id: 'reviews', type: 'reviews', title: 'Google reviews', showTitle: false }),
    section({
      id: 'features',
      type: 'features',
      title: 'Services',
      showTitle: false,
      items: [
        item({ id: 'feat-1', title: 'Free Shipping in India', showText: true, text: 'Enjoy swift and secure delivery right to your doorstep — free of charge across India.', icon: 'tabler-truck' }),
        item({ id: 'feat-2', title: 'Customer Care Service', showText: true, text: 'Our support team is always here to help — day or night.', icon: 'tabler-phone' }),
        item({ id: 'feat-3', title: 'Safe & Secure Payment', showText: true, text: 'Shop with confidence. Our platform is SSL-protected.', icon: 'tabler-shield-check' }),
        item({ id: 'feat-4', title: 'Live Shopping', showText: true, text: 'Get personalized style advice in real time.', icon: 'tabler-video' }),
        item({ id: 'feat-5', title: 'Stitching Service', showText: true, text: 'From size customization to perfect tailoring.', icon: 'tabler-shirt' })
      ]
    })
  ]
})
