import { NextResponse } from 'next/server'

import { getDb } from '@/libs/mongo'
import { getWebUserProfile } from '@/libs/otp'
import { listRentBookingsForEmail } from '@/libs/rentals'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ user: null, contact: null, bookings: [] })

  const [profile, bookings] = await Promise.all([
    getWebUserProfile(session.id),
    listRentBookingsForEmail(session.email)
  ])

  const addresses = profile?.addresses || []
  const address = addresses.find(item => item.isDefault) || addresses[0]
  const lastRent = bookings.find(item => item.customerName || item.customerPhone)

  let orderName = ''
  let orderPhone = ''

  if (!address?.name || !address?.phone) {
    const db = await getDb()
    const order = await db.collection('WebOrder').find({ userEmail: session.email.toLowerCase() }).sort({ createdAt: -1 }).limit(1).next()
    const customer = (order?.customer || {}) as { name?: string; phone?: string }

    orderName = String(customer.name || '')
    orderPhone = String(customer.phone || '')
  }

  return NextResponse.json({
    user: { id: session.id, email: session.email },
    contact: {
      name: profile?.name || address?.name || lastRent?.customerName || orderName || '',
      phone: profile?.phone || address?.phone || lastRent?.customerPhone || orderPhone || '',
      email: session.email
    },
    bookings
  })
}
