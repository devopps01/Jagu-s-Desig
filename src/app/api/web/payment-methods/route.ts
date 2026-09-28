import { NextResponse } from 'next/server'

import { listActivePaymentMethods } from '@/libs/payment-methods'

export async function GET() {
  const rows = await listActivePaymentMethods()

  return NextResponse.json(
    rows.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      details: item.details,
      instructions: item.instructions
    }))
  )
}
