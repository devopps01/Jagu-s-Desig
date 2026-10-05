'use client'

import { useSiteTheme } from '@web/lib/site-theme'

const BrandLogo = ({ height, className = '' }: { height?: number; className?: string }) => {
  const { theme } = useSiteTheme()
  const logoHeight = height ?? theme.logoHeight ?? 96

  return (
    <img
      src={theme.logoUrl || '/images/brand/jagu-logo.png'}
      alt={theme.logoAlt || "Jagu's Designing — Chaniya Choli"}
      height={logoHeight}
      className={className}
      style={{ width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain', objectPosition: 'center' }}
    />
  )
}

export default BrandLogo
