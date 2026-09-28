import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { countWishlists, listWishlistsTable } from '@/libs/wishlists'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)

  if (url.searchParams.get('count') === '1') {
    return NextResponse.json({ count: await countWishlists() })
  }

  return NextResponse.json(await listWishlistsTable(parseTableQuery(url)))
}
