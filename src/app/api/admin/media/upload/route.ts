import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getDb } from '@/libs/mongo'
import { resolvePublicDir, sanitizeFileName, toPublicUrl } from '@/libs/media'

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') || '')
  const name = String(form.get('name') || '')
  const alt = String(form.get('alt') || '').trim()

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Image file is required' }, { status: 400 })
  }

  if (!name.trim() || !alt) {
    return NextResponse.json({ message: 'Image name and alt text are required' }, { status: 400 })
  }

  const { stem, ext } = sanitizeFileName(name.includes('.') ? name : `${name}${path.extname(file.name)}`)
  const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']

  if (!allowed.includes(ext)) {
    return NextResponse.json({ message: 'Unsupported image type' }, { status: 400 })
  }

  try {
    const { relative, resolved } = resolvePublicDir(folder)
    const fileName = `${stem}${ext}`
    const dest = path.join(resolved, fileName)

    await mkdir(resolved, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())

    await writeFile(dest, buffer)

    const url = toPublicUrl(relative, fileName)
    const db = await getDb()

    await db.collection('MediaFile').insertOne({
      name: stem,
      alt,
      url,
      folder: relative,
      createdAt: new Date()
    })

    return NextResponse.json({ ok: true, url, name: stem, alt, fileName })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Upload failed' }, { status: 400 })
  }
}
