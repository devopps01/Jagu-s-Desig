import { imageAttrs, type ImageSize } from '@web/lib/image-src'

/** Desktop/Windows image with optional mobile/Android image. Mobile falls back to desktop. */
const ResponsiveHomeImage = ({
  image,
  imageMobile,
  alt,
  size = 'card',
  loading = 'lazy',
  className
}: {
  image?: string
  imageMobile?: string
  alt: string
  size?: ImageSize
  loading?: 'lazy' | 'eager'
  className?: string
}) => {
  const desktop = String(image || '').trim()
  const mobile = String(imageMobile || '').trim()
  const fallback = desktop || mobile

  if (!fallback) return null

  const desktopAttrs = imageAttrs(desktop || mobile, size)
  const mobileSrc = mobile && mobile !== desktop ? mobile : ''

  if (!mobileSrc) {
    return <img className={className} {...desktopAttrs} alt={alt} loading={loading} decoding='async' />
  }

  const mobileAttrs = imageAttrs(mobileSrc, size)

  return (
    <picture className={className}>
      <source media='(max-width: 980px)' srcSet={mobileAttrs.srcSet || mobileAttrs.src} sizes={mobileAttrs.sizes || '100vw'} />
      <img {...desktopAttrs} alt={alt} loading={loading} decoding='async' />
    </picture>
  )
}

export default ResponsiveHomeImage
