import { Cormorant_Garamond, Great_Vibes, Playfair_Display } from 'next/font/google'

import './brand-wordmark.css'

const scriptFont = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  display: 'swap'
})

const titleFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap'
})

const labelFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap'
})

const BrandWordmark = ({
  compact = false,
  align = 'left',
  showTagline = false
}: {
  compact?: boolean
  align?: 'center' | 'left'
  showTagline?: boolean
}) => (
  <p className={`jagu-mark ${align === 'left' ? 'jagu-mark--left' : ''} ${compact ? 'jagu-mark--compact' : ''}`}>
    <span className={`jagu-mark__script ${scriptFont.className}`}>Jagu&apos;s</span>
    <span className={`jagu-mark__title ${titleFont.className}`}>Designing</span>
    {showTagline ? (
      <span className={`jagu-mark__sub ${labelFont.className}`}>Chaniya Choli</span>
    ) : null}
  </p>
)

export default BrandWordmark
