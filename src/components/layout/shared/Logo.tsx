'use client'

import type { CSSProperties } from 'react'

import BrandLogo from '@/components/BrandLogo'

const Logo = (_props: { color?: CSSProperties['color'] }) => (
  <div className='flex items-center' style={{ maxWidth: 168 }}>
    <BrandLogo height={58} />
  </div>
)

export default Logo
