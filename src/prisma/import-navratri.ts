import { readFileSync, existsSync } from 'fs'
import path from 'path'

import { MongoClient } from 'mongodb'

import { slugify } from '../libs/slug'

type Item = {
  file: number
  name: string
  color: string
  fabric: string
  craft: string
  design: string
  price: number
  set: string
  blouse: string
  skirt: string
  dupatta: string
  lead: string
  more: string
  points: string[]
}

const uri = process.env.DATABASE_URL

if (!uri) {
  console.error('DATABASE_URL is missing')
  process.exit(1)
}

const catalog = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/prisma/navratri-catalog.json'), 'utf8')
) as Item[]

const html = (item: Item) =>
  `<p>${item.lead}</p><p>${item.more}</p><ul>${item.points.map(point => `<li>${point}</li>`).join('')}</ul>`

const run = async () => {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()
  const now = new Date()

  await db.collection('Product').createIndex({ slug: 1 }, { unique: true }).catch(() => undefined)

  const festive = await db.collection('Category').findOne({ slug: 'festive' })
  if (!festive) {
    await db.collection('Category').insertOne({
      name: 'Festive',
      slug: 'festive',
      description: 'Navratri and festive chaniya choli.',
      imageUrl: '/images/brand/jagu-logo.png',
      imageName: 'jagu-logo',
      imageAlt: "Jagu's Designing",
      type: 'main',
      parentId: null,
      status: 'active',
      sortOrder: 35,
      createdAt: now,
      updatedAt: now
    })
  }

  let saved = 0

  for (const item of catalog) {
    const slug = slugify(item.name)
    const primary = `/uploads/navratri/${item.file}.jpg`
    const altPath = path.join(process.cwd(), 'public', 'uploads', 'navratri', `${item.file}-2.jpg`)
    const images = existsSync(altPath) ? [primary, `/uploads/navratri/${item.file}-2.jpg`] : [primary]
    const description = html(item)
    const sellingMrp = Math.round(item.price * 1.18)
    const payload = {
      name: item.name,
      slug,
      description,
      imageUrl: primary,
      images,
      imageName: item.name,
      imageAlt: `${item.name} by Jagu's Designing`,
      listingType: 'sale' as const,
      sellingPrice: item.price,
      sellingMrp,
      rentPrice: 0,
      rentMrp: 0,
      collections: ['navratri', 'festive', 'latest-trend'],
      fabric: item.fabric,
      color: item.color,
      craft: item.craft,
      occasion: 'Navratri',
      design: item.design,
      style: 'Chaniya Choli',
      styles: ['Chaniya Choli'],
      details: [
        { label: 'Set', value: item.set },
        { label: 'Blouse', value: item.blouse },
        { label: 'Chaniya', value: item.skirt },
        { label: 'Dupatta', value: item.dupatta },
        { label: 'Fabric', value: item.fabric },
        { label: 'Work', value: item.craft },
        { label: 'Colour', value: item.color },
        { label: 'Occasion', value: 'Navratri, garba and festive evenings' },
        { label: 'Wash care', value: 'Dry clean only' },
        { label: 'Made in', value: 'Surat, India' }
      ],
      seoTitle: `${item.name} | Jagu's Designing`,
      seoDescription: item.lead,
      status: 'active' as const,
      source: 'navratri-folder-2026',
      sourceFile: item.file,
      rating: 0,
      reviews: 0,
      updatedAt: now
    }

    const exists = await db.collection('Product').findOne({ slug })
    if (exists) {
      await db.collection('Product').updateOne({ slug }, { $set: payload })
    } else {
      await db.collection('Product').insertOne({ ...payload, createdAt: now })
    }
    saved += 1
  }

  const count = await db.collection('Product').countDocuments({ source: 'navratri-folder-2026' })
  console.log(`Saved ${saved} Navratri products. Matching source count: ${count}`)
  await client.close()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
