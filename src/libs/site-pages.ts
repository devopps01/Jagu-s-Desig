export type SitePageKind = 'home' | 'contact' | 'content' | 'header' | 'footer' | 'theme'

export type SitePageMeta = {
  id: string
  label: string
  path: string
  kind: SitePageKind
  icon: string
  hint: string
}

export const SITE_PAGES: SitePageMeta[] = [
  { id: 'home', label: 'Home', path: '/', kind: 'home', icon: 'tabler-home', hint: 'Full home page sections' },
  { id: 'theme', label: 'Theme', path: '/', kind: 'theme', icon: 'tabler-palette', hint: 'Logo, colours, fonts and shape for the whole site' },
  { id: 'header', label: 'Header', path: '/', kind: 'header', icon: 'tabler-layout-navbar', hint: 'Top ticker, phone & floating WhatsApp' },
  { id: 'footer', label: 'Footer', path: '/', kind: 'footer', icon: 'tabler-layout-bottombar', hint: 'Footer text, titles and atelier column' },
  { id: 'about', label: 'About', path: '/about', kind: 'content', icon: 'tabler-building-store', hint: 'About us story page' },
  { id: 'contact', label: 'Contact', path: '/contact', kind: 'contact', icon: 'tabler-mail', hint: 'Phone, WhatsApp, hours and store address' },
  { id: 'video', label: 'Video shopping', path: '/video', kind: 'content', icon: 'tabler-video', hint: 'Video call shopping page' },
  { id: 'shipping', label: 'Shipping', path: '/shipping', kind: 'content', icon: 'tabler-truck', hint: 'Shipping policy' },
  { id: 'returns', label: 'Returns', path: '/returns', kind: 'content', icon: 'tabler-truck-return', hint: 'Return & exchange policy' },
  { id: 'privacy', label: 'Privacy', path: '/privacy', kind: 'content', icon: 'tabler-shield-lock', hint: 'Privacy policy' },
  { id: 'terms', label: 'Terms', path: '/terms', kind: 'content', icon: 'tabler-file-text', hint: 'Terms of use' }
]

export const getSitePage = (id: string) => SITE_PAGES.find(page => page.id === id) || SITE_PAGES[0]

export type ContentBlock = {
  id: string
  enabled: boolean
  title: string
  paragraphs: string
  list: string
}

export type ContentAction = {
  id: string
  enabled: boolean
  label: string
  href: string
  style: 'solid' | 'outline'
}

export type ContentPageSettings = {
  page: string
  kicker: string
  title: string
  intro: string
  showBanner: boolean
  bannerImage: string
  bannerImageMobile: string
  bannerKicker: string
  bannerTitle: string
  bannerText: string
  bannerButtonLabel: string
  bannerButtonHref: string
  blocks: ContentBlock[]
  actions: ContentAction[]
  footerNote: string
}

const block = (partial: Partial<ContentBlock> & Pick<ContentBlock, 'id' | 'title'>): ContentBlock => ({
  enabled: true,
  paragraphs: '',
  list: '',
  ...partial
})

const action = (partial: Partial<ContentAction> & Pick<ContentAction, 'id' | 'label' | 'href'>): ContentAction => ({
  enabled: true,
  style: 'solid',
  ...partial
})

export const createContentBlock = (): ContentBlock =>
  block({
    id: `block-${Date.now().toString(36)}`,
    title: 'New section',
    paragraphs: 'Write your text here.'
  })

export const createContentAction = (): ContentAction =>
  action({
    id: `action-${Date.now().toString(36)}`,
    label: 'Shop now',
    href: '/collections/all',
    style: 'solid'
  })

const defaults: Record<string, () => ContentPageSettings> = {
  about: () => ({
    page: 'about',
    kicker: 'Our house',
    title: 'About Jagu’s Designing',
    intro:
      'A Surat-born atelier of chaniya choli. We cut, embroider and finish each piece so the drape, the mirror work and the colour stay true from the first garba to the last phera.',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [
      block({
        id: 'who',
        title: 'Who we are',
        paragraphs:
          'Jagu’s Designing began in Surat, Gujarat — a city that lives in textile. What started as a workshop for festive wear is now a house women trust for Navratri nights, wedding mandaps, engagements and family celebrations.\n\nWe design for women who want tradition with a modern line. The silhouette is familiar. The embroidery, colour and fall are finished so the piece feels light on the floor and sure in a photograph.\n\nThe factory and the main atelier sit in Mota Varachha, Surat. You can try a piece by video call, or visit the atelier after you write to us.'
      }),
      block({
        id: 'make',
        title: 'What we make',
        paragraphs:
          'Our work is chaniya choli first: mirrored, thread-worked and ready for garba. Around that we also dress weddings, engagements and parties with coordinated sets, dupattas and pieces you can rent when you need a look for one night.\n\nEach garment is checked for stitch, lining, zip and embroidery before it leaves the table. Hand work will vary slightly from piece to piece. That is the craft, not a fault.',
        list: 'Navratri and garba edits, made to move\nWedding and engagement sets with heavier work\nReady-to-ship pieces and made-to-measure on request\nRentals when you want a look for a fixed date'
      }),
      block({
        id: 'work',
        title: 'How we work with you',
        paragraphs:
          'You can shop the site, write on WhatsApp, book a video call, or visit the Surat atelier. Share the occasion, the date and a sense of size. We reply with pieces, timelines and what is in stock.\n\nOrders placed on the website can be tracked, cancelled before dispatch, or returned within seven days of delivery if the fit or quality is not right.'
      }),
      block({
        id: 'visit',
        title: 'Visit and write',
        paragraphs:
          'Surat atelier — Jagu’s Designing Collections, 93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101, India. Phone (+91) 90333 01412.\n\nHours are Monday to Saturday, 11:00 AM to 8:00 PM. Sunday is by appointment for trials and pickups.'
      })
    ],
    actions: [
      action({ id: 'shop', label: 'Shop the collection', href: '/collections/all', style: 'solid' }),
      action({ id: 'contact', label: 'Contact the atelier', href: '/contact', style: 'outline' })
    ],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }),
  video: () => ({
    page: 'video',
    kicker: 'Video shopping',
    title: 'How a call works',
    intro: 'You stay at home. We hold the piece to the light, walk the mirror work, and help you choose a size.',
    showBanner: true,
    bannerImage: '/images/home/home-video.png',
    bannerImageMobile: '',
    bannerKicker: 'Bespoke service',
    bannerTitle: 'Shop via video call',
    bannerText: 'A private styling session. See the embroidery, the colour and the drape before you buy or rent.',
    bannerButtonLabel: 'Book a call',
    bannerButtonHref: '/contact',
    blocks: [
      block({
        id: 'who',
        title: 'Who it is for',
        paragraphs:
          'Video shopping helps when you cannot visit the Surat atelier, when you want to compare two cholis, or when a sister is choosing with you from another city.\n\nIt is also useful before a rental. You see the exact piece we will hold for your dates.'
      }),
      block({
        id: 'prep',
        title: 'What to send before we call',
        paragraphs: 'Write on Contact us or WhatsApp. Share the occasion, the date, a budget if you have one, and a recent blouse size.',
        list: 'Occasion and function date\nCity and whether you need shipping or store pickup\nSize or measurements\nTwo or three pieces you want to see first'
      }),
      block({
        id: 'during',
        title: 'During the call',
        paragraphs:
          'We show front, back and close embroidery. We move the fabric so you see fall and weight. If you decide on the call, we place the order the same way as the website.'
      })
    ],
    actions: [
      action({ id: 'book', label: 'Book a video call', href: '/contact', style: 'solid' }),
      action({ id: 'shop', label: 'Browse the collection', href: '/collections/all', style: 'outline' })
    ],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }),
  shipping: () => ({
    page: 'shipping',
    kicker: 'Policy',
    title: 'Shipping policy',
    intro: 'Every order leaves the Surat atelier packed for embroidery and drape. We share tracking on WhatsApp once the courier is assigned.',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [
      block({
        id: 'where',
        title: 'Where we ship',
        paragraphs:
          'We ship across India on every order. Cash on delivery is available at checkout for most Indian pin codes.\n\nWorldwide shipping is available on request. Write the destination city before you pay.'
      }),
      block({
        id: 'when',
        title: 'When we dispatch',
        paragraphs: 'Ready pieces usually leave in 2–4 working days after we confirm the order, size and address. Festival weeks can take longer.',
        list: 'Working days are Monday to Saturday\nSunday orders are confirmed the next morning\nWe do not dispatch until the address and phone are clear\nA store pickup in Surat can replace courier if you ask'
      })
    ],
    actions: [
      action({ id: 'shop', label: 'Continue shopping', href: '/collections/all', style: 'solid' }),
      action({ id: 'track', label: 'Track an order', href: '/track-order', style: 'outline' })
    ],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }),
  returns: () => ({
    page: 'returns',
    kicker: 'Policy',
    title: 'Return & exchange',
    intro: 'Cancel while we still have the piece. Return within 7 days of delivery if the fit or quality is not right.',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [
      block({
        id: 'cancel',
        title: 'Cancel an order',
        paragraphs: 'You can cancel while the order is New, Confirmed or Packed. Once the order is Shipped, use Return after delivery.',
        list: 'COD cancels do not need a refund\nIf you already paid online, we mark the order refunded after we approve\nCustom work that has started cannot be cancelled unless we made an error'
      }),
      block({
        id: 'return',
        title: 'Return or exchange',
        paragraphs: 'Open a return within 7 days of delivery from My orders or Track order. Keep tags and packing until we confirm.'
      })
    ],
    actions: [
      action({ id: 'track', label: 'Track / return', href: '/track-order', style: 'solid' }),
      action({ id: 'contact', label: 'Contact us', href: '/contact', style: 'outline' })
    ],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }),
  privacy: () => ({
    page: 'privacy',
    kicker: 'Policy',
    title: 'Privacy policy',
    intro: 'We keep only what we need to take your order, reply to you and improve the atelier. We do not sell customer lists.',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [
      block({
        id: 'collect',
        title: 'What we collect',
        paragraphs: 'When you log in we store your email. When you order we store the name, phone and address you typed, the pieces and how you paid.',
        list: 'Email for OTP login and order mail\nPhone and address for delivery and WhatsApp updates\nOrder, rental and request history'
      }),
      block({
        id: 'use',
        title: 'How we use it',
        paragraphs: 'We use your details to confirm orders, send OTPs, share tracking and reply on WhatsApp or email. We do not sell your email or phone to other shops.'
      })
    ],
    actions: [action({ id: 'contact', label: 'Contact us', href: '/contact', style: 'solid' })],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }),
  terms: () => ({
    page: 'terms',
    kicker: 'Policy',
    title: 'Terms of use',
    intro: 'By using this website you agree to shop with the Surat atelier under these simple terms.',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [
      block({
        id: 'orders',
        title: 'Orders and payment',
        paragraphs: 'An order is confirmed when we accept it and share an order number. Prices are in INR unless we write otherwise. Stock and colour can change; we tell you if a piece is no longer available.'
      }),
      block({
        id: 'use',
        title: 'Using the site',
        paragraphs: 'Do not misuse the site, copy product photos for resale, or share login OTPs. Hand embroidery varies slightly from piece to piece.'
      })
    ],
    actions: [
      action({ id: 'shop', label: 'Shop the collection', href: '/collections/all', style: 'solid' }),
      action({ id: 'privacy', label: 'Privacy policy', href: '/privacy', style: 'outline' })
    ],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  })
}

export const defaultContentPage = (page: string): ContentPageSettings => {
  const factory = defaults[page]

  if (factory) return factory()

  return {
    page,
    kicker: 'Information',
    title: getSitePage(page).label,
    intro: '',
    showBanner: false,
    bannerImage: '',
    bannerImageMobile: '',
    bannerKicker: '',
    bannerTitle: '',
    bannerText: '',
    bannerButtonLabel: '',
    bannerButtonHref: '',
    blocks: [createContentBlock()],
    actions: [],
    footerNote: 'Questions? Write on Contact us or track a bill on Track order.'
  }
}

export const paragraphsToList = (value: string) =>
  String(value || '')
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean)

export const listToText = (items?: string[]) => (Array.isArray(items) ? items.join('\n') : '')
