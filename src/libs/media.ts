import { mkdir, readdir, stat, writeFile } from 'fs/promises'
import path from 'path'

const PUBLIC_ROOT = path.join(process.cwd(), 'public')

export const sanitizeRelPath = (input = '') => {
  const cleaned = input.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\./g, '')

  return cleaned === 'public' ? '' : cleaned.replace(/^public\/?/, '')
}

export const resolvePublicDir = (relPath = '') => {
  const relative = sanitizeRelPath(relPath)
  const resolved = path.resolve(PUBLIC_ROOT, relative)
  const root = path.resolve(PUBLIC_ROOT)

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid folder path')
  }

  return { relative, resolved }
}

export const toPublicUrl = (relativeFolder: string, fileName: string) => {
  const parts = [relativeFolder.replace(/\\/g, '/'), fileName].filter(Boolean).join('/')

  return `/${parts}`.replace(/\/{2,}/g, '/')
}

export const ensurePublicUploads = async () => {
  await mkdir(path.join(PUBLIC_ROOT, 'uploads'), { recursive: true })
}

export const listPublicFolder = async (relPath = '') => {
  await ensurePublicUploads()

  const { relative, resolved } = resolvePublicDir(relPath)
  // Path is checked against public/ at runtime; the folder name itself is user input.
  const entries = await readdir(/* turbopackIgnore: true */ resolved, { withFileTypes: true })
  const folders: string[] = []
  const files: { name: string; url: string; size: number }[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    if (entry.isDirectory()) {
      folders.push(entry.name)
    } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) {
      const info = await stat(/* turbopackIgnore: true */ path.join(resolved, entry.name))

      files.push({
        name: entry.name,
        url: toPublicUrl(relative, entry.name),
        size: info.size
      })
    }
  }

  return {
    path: relative,
    folders: folders.sort(),
    files: files.sort((a, b) => a.name.localeCompare(b.name))
  }
}

export const createPublicFolder = async (relPath: string, name: string) => {
  const safeName = name.trim().replace(/[^a-zA-Z0-9-_]/g, '-')

  if (!safeName) {
    throw new Error('Folder name is required')
  }

  const { resolved } = resolvePublicDir(relPath)
  const next = path.join(resolved, safeName)

  await mkdir(/* turbopackIgnore: true */ next, { recursive: true })

  const parent = sanitizeRelPath(relPath)

  return (parent ? `${parent}/${safeName}` : safeName).replace(/\\/g, '/')
}

export const sanitizeFileName = (name: string) => {
  const base = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  const ext = path.extname(base)
  const stem = path.basename(base, ext).slice(0, 80) || 'image'

  return { stem, ext: ext.toLowerCase() || '.jpg' }
}

const REVIEW_IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp']
const REVIEW_IMAGE_MAX = 4 * 1024 * 1024

export const isStoredReviewImage = (url: string) => /^\/uploads\/reviews\/[a-zA-Z0-9._-]+$/.test(url)

export const saveReviewImage = async (file: File, userId: string) => {
  const { stem, ext } = sanitizeFileName(file.name)

  if (!REVIEW_IMAGE_EXT.includes(ext)) {
    throw new Error('Please upload a JPG, PNG or WEBP photo')
  }

  if (file.size > REVIEW_IMAGE_MAX) {
    throw new Error('Each photo must be under 4 MB')
  }

  const { relative, resolved } = resolvePublicDir('uploads/reviews')

  await mkdir(/* turbopackIgnore: true */ resolved, { recursive: true })

  const fileName = `${String(userId).slice(0, 8)}-${Date.now()}-${stem.slice(0, 24)}${ext}`

  await writeFile(/* turbopackIgnore: true */ path.join(resolved, fileName), Buffer.from(await file.arrayBuffer()))

  return toPublicUrl(relative, fileName)
}
