export type ImageSize = 'thumb' | 'card' | 'banner' | 'full'

const ALLOWED = [64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200]

const SPECS: Record<ImageSize, { widths: number[]; sizes: string; fallback: number }> = {
  thumb: { widths: [64, 96], sizes: '72px', fallback: 64 },
  card: { widths: [96, 128, 256], sizes: '(max-width: 760px) 42vw, 240px', fallback: 128 },
  banner: { widths: [640, 828, 1080], sizes: '(max-width: 760px) 100vw, 1080px', fallback: 640 },
  full: { widths: [640, 828, 1080, 1200], sizes: '(max-width: 760px) 100vw, 640px', fallback: 640 }
}

const passthrough = (src?: string) =>
  !src || src.startsWith('data:') || src.startsWith('blob:') || /\.svg($|\?)/i.test(src) || (!src.startsWith('/') && !src.startsWith('http'))

const urlFor = (src: string, width: number) => {
  const w = ALLOWED.find(item => item >= width) || ALLOWED[ALLOWED.length - 1]

  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
}

export const sizedSrc = (src?: string, size: ImageSize = 'card') => {
  if (!src || passthrough(src)) return src || ''

  return urlFor(src, SPECS[size].fallback)
}

export const imageAttrs = (src?: string, size: ImageSize = 'card') => {
  if (!src || passthrough(src)) return { src: src || '' }

  const spec = SPECS[size]

  return {
    src: urlFor(src, spec.fallback),
    srcSet: spec.widths.map(width => `${urlFor(src, width)} ${width}w`).join(', '),
    sizes: spec.sizes
  }
}
