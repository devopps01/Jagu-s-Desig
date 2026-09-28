import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createPaymentMethod, listPaymentMethodsTable } from '@/libs/payment-methods'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listPaymentMethodsTable(parseTableQuery(new URL(req.url))))
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await createPaymentMethod(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save payment method' }, { status: 400 })
  }
}
