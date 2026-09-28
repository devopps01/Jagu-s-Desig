const ProductMedia = ({
  src,
  alt,
  className
}: {
  src?: string
  alt: string
  className?: string
}) => {
  if (!src) {
    return <div className={`vn-media-fallback ${className || ''}`} />
  }

  return <img src={src} alt={alt} className={className} />
}

export default ProductMedia
