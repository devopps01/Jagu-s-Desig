import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createStyle, listActiveStyles, listStylesTable } from '@/libs/store-styles'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)

  if (url.searchParams.get('active') === '1') return NextResponse.json(await listActiveStyles())

  return NextResponse.json(await listStylesTable(parseTableQuery(url)))
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await createStyle(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save style' }, { status: 400 })
  }
}
