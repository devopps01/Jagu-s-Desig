export type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

export type ContactSettings = {
  headline: string
  intro: string
  email: string
  phone: string
  whatsapp: string
  hours: string
  suratTitle: string
  suratAddress: string
  bangaloreTitle: string
  bangaloreAddress: string
  bangalorePhone: string
  suratMapQuery: string
  bangaloreMapQuery: string
}

export const STORE_PHONE_DISPLAY = '(+91) 8154 0000 63'
export const STORE_WHATSAPP = '918154000063'

export const toWhatsAppDigits = (value?: string) => {
  const digits = String(value || '').replace(/\D/g, '') || STORE_WHATSAPP

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

export const defaultContactSettings: ContactSettings = {
  headline: 'We would love to hear from you',
  intro: 'Write for custom orders, rentals, store visits or styling help. The atelier replies on WhatsApp and email.',
  email: '',
  phone: STORE_PHONE_DISPLAY,
  whatsapp: STORE_WHATSAPP,
  hours: 'Monday – Saturday, 11:00 AM – 8:00 PM',
  suratTitle: 'Surat atelier',
  suratAddress: SURAT_ATELIER.full,
  bangaloreTitle: 'Bangalore store',
  bangaloreAddress: '',
  bangalorePhone: '',
  suratMapQuery: SURAT_ATELIER.mapQuery,
  bangaloreMapQuery: ''
}
