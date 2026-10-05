export type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

export type ContactHelpCard = {
  id: string
  enabled: boolean
  icon: string
  title: string
  copy: string
}

export type ContactTopic = {
  id: string
  enabled: boolean
  icon: string
  title: string
  points: string
}

export type ContactFaq = {
  id: string
  enabled: boolean
  question: string
  answer: string
}

export type ContactSettings = {
  kicker: string
  headline: string
  intro: string
  email: string
  phone: string
  whatsapp: string
  hours: string
  hoursTitle: string
  hoursNote: string
  suratTitle: string
  suratAddress: string
  bangaloreTitle: string
  bangaloreAddress: string
  bangalorePhone: string
  suratMapQuery: string
  bangaloreMapQuery: string
  helpNote: string
  helpTitle: string
  helpCards: ContactHelpCard[]
  topicsNote: string
  topicsTitle: string
  topics: ContactTopic[]
  replyTitle: string
  replyText: string
  whatsappButtonLabel: string
  emailButtonLabel: string
  videoButtonLabel: string
  videoButtonHref: string
  formKicker: string
  formTitle: string
  formNote: string
  formSuccessTitle: string
  formSuccessText: string
  formSubmitLabel: string
  subjects: string
  mapNote: string
  mapTitle: string
  faqNote: string
  faqTitle: string
  faqs: ContactFaq[]
}

export const STORE_PHONE_DISPLAY = '(+91) 90333 01412'
export const STORE_WHATSAPP = '919033301412'

export const toWhatsAppDigits = (value?: string) => {
  let digits = String(value || '').replace(/\D/g, '') || STORE_WHATSAPP

  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1)

  return digits.length === 10 ? `91${digits}` : digits
}

export const storeWhatsAppHref = (text?: string, number?: string) => {
  const href = `https://wa.me/${toWhatsAppDigits(number)}`

  return text ? `${href}?text=${encodeURIComponent(text)}` : href
}

export const storeTelHref = (phone?: string) => `tel:+${toWhatsAppDigits(phone)}`

export const SURAT_ATELIER = {
  name: "Jagu's Designing Collections",
  line1: '93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha',
  line2: 'Surat, Gujarat 394101, India',
  full: "Jagu's Designing Collections, 93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101, India",
  mapQuery: '93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101',
  lat: 21.231708,
  lng: 72.881221
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export const createContactHelpCard = (partial: Partial<ContactHelpCard> = {}): ContactHelpCard => ({
  id: partial.id || uid('help'),
  enabled: partial.enabled !== false,
  icon: partial.icon || 'tabler-message',
  title: partial.title || 'New help card',
  copy: partial.copy || 'Write the short description here.'
})

export const createContactTopic = (partial: Partial<ContactTopic> = {}): ContactTopic => ({
  id: partial.id || uid('topic'),
  enabled: partial.enabled !== false,
  icon: partial.icon || 'tabler-sparkles',
  title: partial.title || 'New topic',
  points: partial.points || 'Point one\nPoint two'
})

export const createContactFaq = (partial: Partial<ContactFaq> = {}): ContactFaq => ({
  id: partial.id || uid('faq'),
  enabled: partial.enabled !== false,
  question: partial.question || 'New question?',
  answer: partial.answer || 'Write the answer here.'
})

export const paragraphsToList = (value: string) =>
  String(value || '')
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean)

export const defaultContactSettings: ContactSettings = {
  kicker: 'Contact & support',
  headline: 'We would love to hear from you',
  intro: 'Write for custom orders, rentals, store visits or styling help. The atelier replies on WhatsApp and email.',
  email: '',
  phone: STORE_PHONE_DISPLAY,
  whatsapp: STORE_WHATSAPP,
  hours: 'Monday – Saturday, 11:00 AM – 8:00 PM',
  hoursTitle: 'Atelier hours',
  hoursNote: 'Sunday by appointment for trials and pickups.',
  suratTitle: 'Surat atelier',
  suratAddress: SURAT_ATELIER.full,
  bangaloreTitle: 'Bangalore store',
  bangaloreAddress: '',
  bangalorePhone: '',
  suratMapQuery: SURAT_ATELIER.mapQuery,
  bangaloreMapQuery: '',
  helpNote: 'How we help',
  helpTitle: 'Proper support, from first message to dispatch',
  helpCards: [
    createContactHelpCard({
      id: 'help-whatsapp',
      icon: 'tabler-brand-whatsapp',
      title: 'WhatsApp styling',
      copy: 'Share a photo or occasion. We reply with pieces, sizes and timelines.'
    }),
    createContactHelpCard({
      id: 'help-video',
      icon: 'tabler-video',
      title: 'Video shopping',
      copy: 'Book a private call to see embroidery, colour and drape before you buy or rent.'
    }),
    createContactHelpCard({
      id: 'help-visit',
      icon: 'tabler-building-store',
      title: 'Store visit',
      copy: 'Visit the Surat atelier. Try a chaniya choli and leave with a confirmed fit.'
    }),
    createContactHelpCard({
      id: 'help-custom',
      icon: 'tabler-needle',
      title: 'Custom & rental',
      copy: 'Ask for a made-to-measure piece, a Navratri rental, or a sister referral offer.'
    })
  ],
  topicsNote: 'Quality · Security · Care',
  topicsTitle: 'What you can expect from Jagu’s Designing',
  topics: [
    createContactTopic({
      id: 'topic-quality',
      icon: 'tabler-sparkles',
      title: 'Quality you can feel',
      points:
        'Every chaniya choli is checked for stitch, lining, zip and embroidery before dispatch.\nMirror, thread and sequin work is packed so it travels without crush.\nIf a piece arrives damaged, we exchange it. Send photos on WhatsApp.\nHand work varies slightly from piece to piece — that is the craft, not a fault.'
    }),
    createContactTopic({
      id: 'topic-secure',
      icon: 'tabler-shield-lock',
      title: 'Secure shopping',
      points:
        'Website login uses a one-time email OTP. We never ask for your password.\nOrders and addresses stay on your account. We do not sell customer data.\nPay online or choose cash on delivery. Card details never pass through our staff chat.\nWrite only on this form, WhatsApp or the listed phones so you reach the real atelier.'
    }),
    createContactTopic({
      id: 'topic-support',
      icon: 'tabler-headset',
      title: 'Support that stays with you',
      points:
        'Most inquiries get a first reply the same working day.\nWe help with size, colour matching, rental dates and store appointments.\nDispatch is usually 2–4 working days after confirmation, with tracking on WhatsApp.\nEasy exchange if the fit or quality is not right. Keep tags and packing till you decide.'
    })
  ],
  replyTitle: 'How we reply',
  replyText: 'WhatsApp and this form are checked through the day. Share your occasion date, city and size so we can help in one reply.',
  whatsappButtonLabel: 'WhatsApp the atelier',
  emailButtonLabel: 'Email us',
  videoButtonLabel: 'Video shopping',
  videoButtonHref: '/video',
  formKicker: 'Write to us',
  formTitle: 'Tell us what you need',
  formNote: 'We never share this form with anyone outside the atelier.',
  formSuccessTitle: 'Message received',
  formSuccessText: 'Thank you. Our team will reply on email or WhatsApp shortly.',
  formSubmitLabel: 'Send message',
  subjects: 'Custom order\nRental inquiry\nStore visit\nStyling help\nQuality issue\nReturn & exchange\nOrder support\nWholesale\nOther',
  mapNote: 'Visit us',
  mapTitle: 'Live map & directions',
  faqNote: 'Questions',
  faqTitle: 'Before you write',
  faqs: [
    createContactFaq({
      id: 'faq-reply',
      question: 'How soon will someone reply?',
      answer:
        'On working days we aim to reply within a few hours on WhatsApp or email. After 8:00 PM or on Sunday, the first reply usually comes the next morning.'
    }),
    createContactFaq({
      id: 'faq-visit',
      question: 'Can I visit without an appointment?',
      answer:
        'Yes during atelier hours. For a custom trial or a busy Navratri week, message us first so a stylist and the pieces you want are ready.'
    }),
    createContactFaq({
      id: 'faq-rental',
      question: 'How do rentals work?',
      answer:
        'Tell us the occasion dates and your size. We hold the piece once the booking is confirmed, share pickup or courier details, and check the garment when it returns.'
    }),
    createContactFaq({
      id: 'faq-fit',
      question: 'What if the embroidery or fit is not right?',
      answer:
        'Photograph the issue in good light and write to us. Quality faults are exchanged. For fit, we guide an alteration or a swap while tags and packing are still with you.'
    }),
    createContactFaq({
      id: 'faq-safe',
      question: 'Is my payment and personal data safe?',
      answer:
        'Yes. Login is OTP-only, checkout uses trusted payment rails or COD, and we keep addresses for your orders only. We will never ask you to share an OTP with a caller.'
    }),
    createContactFaq({
      id: 'faq-ship',
      question: 'Do you ship outside India?',
      answer:
        'Yes, worldwide shipping is available on request. Duties and extra transit time depend on the destination. We share a tracking link once the parcel leaves Surat.'
    }),
    createContactFaq({
      id: 'faq-custom',
      question: 'Can you make a custom size or colour?',
      answer:
        'Yes. Send your measurements, a reference photo and the occasion date. We confirm fabric, embroidery and a timeline before work begins.'
    }),
    createContactFaq({
      id: 'faq-track',
      question: 'How do I track an order?',
      answer:
        'Use Track Order in the footer, or message us your order ID. We also send dispatch updates on WhatsApp when the courier is assigned.'
    })
  ]
}
