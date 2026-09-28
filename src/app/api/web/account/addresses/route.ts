import { NextResponse } from 'next/server'

import { listAddresses, removeAddress, setDefaultAddress, upsertAddress } from '@/libs/addresses'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listAddresses(session.id))
}

export async function POST(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await upsertAddress(session.id, await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not save address' }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if (body.action === 'default') {
      return NextResponse.json(await setDefaultAddress(session.id, String(body.id || '')))
    }

    return NextResponse.json(await upsertAddress(session.id, body))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update address' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const id = new URL(req.url).searchParams.get('id') || (await req.json()).id

    return NextResponse.json(await removeAddress(session.id, String(id || '')))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not delete address' }, { status: 400 })
  }
}
