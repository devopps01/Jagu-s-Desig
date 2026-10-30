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

  return uploaded.map((src, index) => ({
    src,
    alt: uploaded.length > 1 ? `${alt} — Photo ${index + 1}` : alt,
    label: uploaded.length > 1 ? `Photo ${index + 1}` : 'Photo',
    position: 'center center',
    scale: 1
  }))
}
