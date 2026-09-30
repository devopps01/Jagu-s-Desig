import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { razorpayKeys } from '@/libs/razorpay'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ enabled: razorpayKeys().enabled })
}
