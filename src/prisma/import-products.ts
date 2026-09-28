import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import path from 'path'

import { MongoClient } from 'mongodb'

import { slugify } from '../libs/slug'

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/jagu_design'
const sourceDir = 'C:\\Users\\HP\\Downloads\\Edited 1\\Edited'
const destDir = path.join(process.cwd(), 'public', 'uploads', 'products')

const names: Record<string, { name: string; color: string; occasion: string; craft: string }> = {
  '1.png': { name: 'Royal Purple Navratri Chaniya Choli', color: 'Purple', occasion: 'Navratri', craft: 'Zari' },
  '2.png': { name: 'Pink Gold Designer Chaniya Choli', color: 'Pink', occasion: 'Wedding', craft: 'Zari' },
  '3.png': { name: 'Red Mirror Work Garba Chaniya', color: 'Red', occasion: 'Navratri', craft: 'Bandhani' },
  '4.png': { name: 'Peacock Green Party Chaniya Choli', color: 'Green', occasion: 'Party', craft: 'Handloom' },
  '5.png': { name: 'Maroon Mirror Work Garba Lehenga', color: 'Maroon', occasion: 'Navratri', craft: 'Bandhani' },
  '6.png': { name: 'Ivory Bridal Engagement Chaniya', color: 'Ivory', occasion: 'Engagement', craft: 'Zari' },
  '7.png': { name: 'Mustard Yellow Festive Chaniya Choli', color: 'Yellow', occasion: 'Navratri', craft: 'Ajrakh' },
  '8.png': { name: 'Black Gold Party Wear Chaniya', color: 'Black', occasion: 'Party', craft: 'Zari' },
  '9.png': { name: 'Sky Blue Latest Trend Chaniya Choli', color: 'Blue', occasion: 'Party', craft: 'Handloom' },
  '10.png': { name: 'Multicolor Tassel Navratri Chaniya', color: 'Pink', occasion: 'Navratri', craft: 'Bandhani' },
  '11.png': { name: 'Wine Velvet Wedding Chaniya Choli', color: 'Maroon', occasion: 'Wedding', craft: 'Zari' },
  '12.png': { name: 'Orange Garba Special Chaniya', color: 'Orange', occasion: 'Navratri', craft: 'Bandhani' },
  '13.png': { name: 'Beige Silk Engagement Lehenga', color: 'Beige', occasion: 'Engagement', craft: 'Handloom' },
  '14.png': { name: 'Rani Pink Bridal Chaniya Choli', color: 'Pink', occasion: 'Wedding', craft: 'Zari' },
  '15.png': { name: 'Teal Mirror Party Chaniya', color: 'Blue', occasion: 'Party', craft: 'Bandhani' },
  '16.png': { name: 'Gold Tissue Latest Trend Chaniya', color: 'Gold', occasion: 'Wedding', craft: 'Zari' },
  '17.png': { name: 'White Pearl Engagement Chaniya Choli', color: 'White', occasion: 'Engagement', craft: 'Zari' },
  '18.png': { name: 'Wine Bandhani Dupatta Chaniya Choli', color: 'Purple', occasion: 'Navratri', craft: 'Bandhani' },
  '19.png': { name: 'Coral Festive Garba Chaniya', color: 'Orange', occasion: 'Navratri', craft: 'Ajrakh' },
  '21.png': { name: 'Emerald Green Wedding Chaniya Choli', color: 'Green', occasion: 'Wedding', craft: 'Zari' },
  '22.png': { name: 'Pastel Lilac Party Chaniya', color: 'Purple', occasion: 'Party', craft: 'Handloom' },
  '23.png': { name: 'Classic Red Bridal Chaniya Choli', color: 'Red', occasion: 'Wedding', craft: 'Zari' },
  '24.png': { name: 'Navy Blue Latest Trend Lehenga', color: 'Blue', occasion: 'Party', craft: 'Handloom' },
  '25.png': { name: 'Fuchsia Garba Mirror Chaniya', color: 'Pink', occasion: 'Navratri', craft: 'Bandhani' },
  '26.png': { name: 'Sand Gold Engagement Chaniya Choli', color: 'Gold', occasion: 'Engagement', craft: 'Zari' },
  '27.png': { name: 'Magenta Thread Work Chaniya', color: 'Pink', occasion: 'Party', craft: 'Zari' },
  '28.png': { name: 'Forest Green Navratri Chaniya Choli', color: 'Green', occasion: 'Navratri', craft: 'Ajrakh' },
  '30.png': { name: 'Champagne Bridal Chaniya Choli', color: 'Beige', occasion: 'Wedding', craft: 'Zari' },
  '31.png': { name: 'Hot Pink Tassel Party Chaniya', color: 'Pink', occasion: 'Party', craft: 'Bandhani' },
  '32.png': { name: 'Royal Blue Engagement Lehenga', color: 'Blue', occasion: 'Engagement', craft: 'Zari' },
  '33.png': { name: 'Saffron Garba Chaniya Choli', color: 'Orange', occasion: 'Navratri', craft: 'Bandhani' },
  '34.png': { name: 'Silver Grey Latest Trend Chaniya', color: 'Grey', occasion: 'Party', craft: 'Handloom' },
  '35.png': { name: 'Deep Purple Wedding Chaniya Choli', color: 'Purple', occasion: 'Wedding', craft: 'Zari' },
  '36.png': { name: 'Mint Green Party Wear Chaniya', color: 'Green', occasion: 'Party', craft: 'Handloom' },
  '37.png': { name: 'Traditional Kutchi Navratri Chaniya Choli', color: 'Red', occasion: 'Navratri', craft: 'Bandhani' }
}

const occasionToCollection: Record<string, string> = {
  Navratri: 'navratri',
  Wedding: 'wedding',
  Engagement: 'engagement',
  Party: 'party'
}

const run = async () => {
  mkdirSync(destDir, { recursive: true })

  const files = readdirSync(sourceDir).filter(file => file.toLowerCase().endsWith('.png'))

  files.forEach(file => {
    copyFileSync(path.join(sourceDir, file), path.join(destDir, file))
  })

  const client = new MongoClient(uri)

  await client.connect()

  const db = client.db()
  const now = new Date()

  await db.collection('Product').createIndex({ slug: 1 }, { unique: true }).catch(() => undefined)

  let inserted = 0

  for (const file of Object.keys(names)) {
    const meta = names[file]
    const slug = slugify(meta.name)
    const exists = await db.collection('Product').findOne({ slug })
    const collection = occasionToCollection[meta.occasion] || 'latest-trend'
    const extra = collection === 'party' ? ['latest-trend'] : ['latest-trend', collection]
    const listingType = inserted % 3 === 0 ? 'both' : inserted % 3 === 1 ? 'sale' : 'rent'
    const sellingPrice = 12990 + inserted * 410
    const rentPrice = 2490 + inserted * 80
    const description = `${meta.name} by Jagu's Designing. Designer chaniya choli for ${meta.occasion.toLowerCase()}, crafted in ${meta.color.toLowerCase()} with ${meta.craft.toLowerCase()} work.`
    const payload = {
      name: meta.name,
      slug,
      description,
      imageUrl: `/uploads/products/${file}`,
      imageName: meta.name,
      imageAlt: meta.name,
      listingType,
      sellingPrice: listingType === 'rent' ? 0 : sellingPrice,
      sellingMrp: listingType === 'rent' ? 0 : Math.round(sellingPrice * 1.22),
      rentPrice: listingType === 'sale' ? 0 : rentPrice,
      rentMrp: listingType === 'sale' ? 0 : Math.round(rentPrice * 1.22),
      collections: Array.from(new Set(extra)),
      fabric: 'Silk Blend',
      color: meta.color,
      craft: meta.craft,
      occasion: meta.occasion,
      design: 'Zari Butta',
      style: 'Chaniya Choli',
      seoTitle: `${meta.name} | Jagu's Designing`,
      seoDescription: description,
      status: 'active',
      rating: 5,
      reviews: 8 + (inserted % 20),
      updatedAt: now
    }

    if (exists) {
      await db.collection('Product').updateOne({ slug }, { $set: payload })
    } else {
      await db.collection('Product').insertOne({ ...payload, createdAt: now })
      inserted += 1
      continue
    }

    inserted += 1
  }

  console.log(`Imported ${inserted} products from ${sourceDir}`)

  await db.collection('CollectionFilter').updateOne(
    { key: 'price' },
    {
      $set: {
        options: [
          { label: 'Under ₹5,000', value: '0-5000', min: 0, max: 5000, active: true },
          { label: '₹5,000 – ₹9,999', value: '5000-9999', min: 5000, max: 9999, active: true },
          { label: '₹10,000 – ₹14,999', value: '10000-14999', min: 10000, max: 14999, active: true },
          { label: '₹15,000 & above', value: '15000-999999', min: 15000, max: 999999, active: true }
        ]
      }
    }
  )

  await client.close()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
