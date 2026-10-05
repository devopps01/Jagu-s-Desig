import { imageAttrs, type ImageSize } from '@web/lib/image-src'

const ProductMedia = ({
  src,
  alt,
  className,
  size = 'card',
  priority = false
}: {
  src?: string
  alt: string
  className?: string
  size?: ImageSize
  priority?: boolean
}) => {
  if (!src) {
    return <div className={`vn-media-fallback ${className || ''}`} />
  }

  return (
    <img
      {...imageAttrs(src, size)}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding='async'
    />
  )
}

export default ProductMedia
