import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createCategory, listCategoriesTable, listMainCategories } from '@/libs/categories'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)

  if (url.searchParams.get('mains') === '1') {
    return NextResponse.json(await listMainCategories())
  }

  return NextResponse.json(await listCategoriesTable(parseTableQuery(url)))
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const created = await createCategory(body)

    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save category' }, { status: 400 })
  }
}
