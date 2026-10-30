import { NextResponse } from 'next/server'

import { ObjectId } from 'mongodb'

import { checkRentAvailability, createRentBooking } from '@/libs/rentals'
import { getDb } from '@/libs/mongo'
import { getRentStoreProduct } from '@/libs/products'
import { getWebSession } from '@/libs/web-auth'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const slug = params.get('slug') || ''
  const product = slug ? await getRentStoreProduct(slug) : null

  if (!product) return NextResponse.json({ available: false, message: 'Outfit not found' }, { status: 404 })

  const result = await checkRentAvailability({
    productSlug: slug,
    size: params.get('size') || '',
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    startTime: params.get('startTime') || '',
    endTime: params.get('endTime') || ''
  })

  return NextResponse.json({ available: result.available, message: result.message })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const slug = String(body.productSlug || body.slug || '').trim()
    const product = await getRentStoreProduct(slug)

    if (!product) {
      return NextResponse.json({ message: 'This outfit is not available for rent' }, { status: 400 })
    }

    const session = await getWebSession()

    if (!session) {
      return NextResponse.json({ message: 'Login to book this outfit' }, { status: 401 })
    }

    const created = await createRentBooking({
      productSlug: slug,
      size: String(body.size || ''),
      startDate: String(body.startDate || ''),
      endDate: String(body.endDate || ''),
      startTime: String(body.startTime || ''),
      endTime: String(body.endTime || ''),
      customerName: String(body.customerName || ''),
      customerPhone: String(body.customerPhone || ''),
      customerEmail: session.email,
      notes: String(body.notes || ''),
      status: 'booked'
    })

    if (ObjectId.isValid(session.id)) {
      const db = await getDb()

      await db.collection('WebUser').updateOne(
        { _id: new ObjectId(session.id) },
        {
          $set: {
            name: String(body.customerName || '').trim(),
            phone: String(body.customerPhone || '').trim(),
            updatedAt: new Date()
          }
        }
      )
    }

    return NextResponse.json({
      ok: true,
      id: created.id,
      message: 'Rental request saved. We will confirm your dates shortly.'
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not book this rental' },
      { status: 400 }
    )
  }
}
