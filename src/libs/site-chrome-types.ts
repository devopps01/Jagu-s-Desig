export type FooterLink = {
  id: string
  enabled: boolean
  label: string
  href: string
}

export type SiteChromeSettings = {
  showAnnouncement: boolean
  announcements: string
  footerTagline: string
  footerCopyright: string
  footerPolicyTitle: string
  footerInfoTitle: string
  footerAtelierTitle: string
  footerPolicyLinks: FooterLink[]
  footerInfoLinks: FooterLink[]
  floatEnabled: boolean
  floatLabel: string
  floatMessage: string
}

export const createFooterLink = (partial: Partial<FooterLink> = {}): FooterLink => ({
  id: partial.id || `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
  enabled: partial.enabled !== false,
  label: partial.label || 'New link',
  href: partial.href || '/'
})

export const defaultFooterPolicyLinks = (): FooterLink[] => [
  createFooterLink({ id: 'pol-returns', label: 'Return & Exchange Policy', href: '/returns' }),
  createFooterLink({ id: 'pol-shipping', label: 'Shipping Policy', href: '/shipping' }),
  createFooterLink({ id: 'pol-terms', label: 'Terms and Conditions', href: '/terms' }),
  createFooterLink({ id: 'pol-privacy', label: 'Privacy Policy', href: '/privacy' }),
  createFooterLink({ id: 'pol-contact', label: 'Contact Us', href: '/contact' })
]

export const defaultFooterInfoLinks = (): FooterLink[] => [
  createFooterLink({ id: 'info-about', label: 'About us', href: '/about' }),
  createFooterLink({ id: 'info-blog', label: 'Blog', href: '/blog' }),
  createFooterLink({ id: 'info-video', label: 'Video Shopping', href: '/video' }),
  createFooterLink({ id: 'info-track', label: 'Track Order', href: '/track-order' }),
  createFooterLink({ id: 'info-account', label: 'My account', href: '__account__' })
]

export const defaultSiteChromeSettings = (): SiteChromeSettings => ({
  showAnnouncement: true,
  announcements: 'Shipping Worldwide\nCOD across India\nEasy Return & Exchange*',
  footerTagline: 'Tradition meets fashion — designer chaniya choli collections.',
  footerCopyright: "Copyright 2026 © Jagu's Designing. All rights reserved.",
  footerPolicyTitle: 'Policy & Inquiry',
  footerInfoTitle: 'Information',
  footerAtelierTitle: 'Atelier',
  footerPolicyLinks: defaultFooterPolicyLinks(),
  footerInfoLinks: defaultFooterInfoLinks(),
  floatEnabled: true,
  floatLabel: 'WhatsApp',
  floatMessage: "Hello Jagu’s Designing, I would like to enquire."
})

export const announcementsToList = (value: string) =>
  String(value || '')
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean)

/** Merge API/draft chrome with defaults so link columns never go blank. */
export const mergeSiteChromeSettings = (input?: Partial<SiteChromeSettings> | null): SiteChromeSettings => {
  const base = defaultSiteChromeSettings()
  const next = { ...base, ...(input || {}) }

  if (!Array.isArray(next.footerPolicyLinks) || next.footerPolicyLinks.length === 0) {
    next.footerPolicyLinks = defaultFooterPolicyLinks()
  }

  if (!Array.isArray(next.footerInfoLinks) || next.footerInfoLinks.length === 0) {
    next.footerInfoLinks = defaultFooterInfoLinks()
  }

  return next
}
