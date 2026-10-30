import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([])
}

export async function POST() {
  return NextResponse.json({ ok: false, message: 'Referral codes are not available' }, { status: 404 })
}
