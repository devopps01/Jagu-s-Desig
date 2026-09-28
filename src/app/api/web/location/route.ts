import { NextResponse } from 'next/server'

import { lookupPincode, reverseGeocode } from '@/libs/location'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const pin = params.get('pincode') || params.get('pin') || ''

  if (pin) {
    try {
      return NextResponse.json(await lookupPincode(pin))
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not look up pincode' }, { status: 400 })
    }
  }

  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ message: 'Location is missing' }, { status: 400 })
  }

  try {
    return NextResponse.json(await reverseGeocode(lat, lng))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not fetch address' }, { status: 400 })
  }
}
