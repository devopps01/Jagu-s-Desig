import { NextResponse } from 'next/server'

import { razorpayKeys } from '@/libs/razorpay'

export async function GET() {
  const { enabled, keyId } = razorpayKeys()

  return NextResponse.json({ enabled, keyId: enabled ? keyId : '' })
}
