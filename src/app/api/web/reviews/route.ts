import { NextResponse } from 'next/server'

import { isStoredReviewImage, saveReviewImage } from '@/libs/media'
import { getProductReviewSummary, upsertReview } from '@/libs/reviews'
import { getWebSession } from '@/libs/web-auth'

const parseKeptImages = (value: unknown) => {
  if (Array.isArray(value)) return value.map(item => String(item || '')).filter(isStoredReviewImage)
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)

    if (Array.isArray(parsed)) return parsed.map(item => String(item || '')).filter(isStoredReviewImage)
  } catch {
    /* comma list */
  }

  return value.split(',').map(item => item.trim()).filter(isStoredReviewImage)
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') || ''
  const session = await getWebSession()

  if (!slug) return NextResponse.json({ message: 'Product is required' }, { status: 400 })

  return NextResponse.json(await getProductReviewSummary(slug, session?.id))
}

export async function POST(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Login to write a review' }, { status: 401 })

  try {
    const type = req.headers.get('content-type') || ''
    let slug = ''
    let name = ''
    let title = ''
    let body = ''
    let rating: unknown = 5
    let images: string[] = []
    let orderId = ''

    if (type.includes('multipart/form-data')) {
      const form = await req.formData()

      slug = String(form.get('slug') || form.get('productSlug') || '')
      name = String(form.get('name') || form.get('userName') || '')
      title = String(form.get('title') || '')
      body = String(form.get('body') || '')
      rating = form.get('rating')
      orderId = String(form.get('orderId') || '')
      images = parseKeptImages(form.get('keptImages') || form.get('images'))

      const files = form.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0)

      for (const file of files) {
        if (images.length >= 4) break
        images.push(await saveReviewImage(file, session.id))
      }
    } else {
      const json = await req.json()

      slug = json.slug || json.productSlug || ''
      name = json.name || json.userName || ''
      title = json.title || ''
      body = json.body || ''
      rating = json.rating
      orderId = json.orderId || ''
      images = parseKeptImages(json.images)
    }

    return NextResponse.json(
      await upsertReview({
        productSlug: slug,
        userId: session.id,
        userEmail: session.email,
        userName: name,
        rating: Number(rating),
        title,
        body,
        images,
        orderId: orderId || undefined
      })
    )
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not save review' }, { status: 400 })
  }
}
