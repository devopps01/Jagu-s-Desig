export const PRODUCT_POSES = [
  { id: 'full', label: 'Full look', position: '50% 8%', scale: 1 },
  { id: 'front', label: 'Front pose', position: '50% 18%', scale: 1.28 },
  { id: 'three-quarter', label: 'Side pose', position: '72% 28%', scale: 1.22 },
  { id: 'close', label: 'Close-up', position: '50% 36%', scale: 1.55 },
  { id: 'work', label: 'Work detail', position: '42% 48%', scale: 1.7 },
  { id: 'flare', label: 'Flare pose', position: '50% 92%', scale: 1.38 }
] as const

export type ProductImageView = {
  src: string
  alt: string
  label: string
  position: string
  scale: number
}

const unique = (urls: string[]) => [...new Set(urls.filter(Boolean))]

export const productGallery = (product: { image?: string; images?: string[]; imageAlt?: string; title?: string }) => {
  const uploaded = unique([...(product.images || []), product.image || ''])
  const alt = product.imageAlt || product.title || 'Product'
  const views: ProductImageView[] = []

  uploaded.forEach((src, index) => {
    const pose = PRODUCT_POSES[index] || PRODUCT_POSES[0]

    views.push({
      src,
      alt: `${alt} — ${pose.label}`,
      label: uploaded.length > 1 ? `Photo ${index + 1}` : pose.label,
      position: uploaded.length > 1 ? '50% 8%' : pose.position,
      scale: uploaded.length > 1 ? 1 : pose.scale
    })
  })

  const cover = uploaded[0]

  if (cover && views.length < 6) {
    PRODUCT_POSES.forEach(pose => {
      if (views.length >= 6) return
      if (views.some(item => item.label === pose.label && item.src === cover)) return

      views.push({
        src: cover,
        alt: `${alt} — ${pose.label}`,
        label: pose.label,
        position: pose.position,
        scale: pose.scale
      })
    })
  }

  return views.slice(0, Math.max(6, views.length))
}
