import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/jagu_design'

const seed = async () => {
  const client = new MongoClient(uri)

  await client.connect()

  const db = client.db()
  const email = 'admin@vuexy.com'
  const passwordHash = await bcrypt.hash('admin', 10)
  const now = new Date()
  const existing = await db.collection('AdminUser').findOne({ email })

  if (existing) {
    await db.collection('AdminUser').updateOne(
      { email },
      { $set: { passwordHash, name: 'Admin', role: 'admin', updatedAt: now } }
    )
  } else {
    await db.collection('AdminUser').insertOne({
      email,
      name: 'Admin',
      passwordHash,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    })
  }

  await db.collection('OtpLog').dropIndex('OtpLog_expiresAt_idx').catch(() => undefined)
  await db.collection('OtpLog').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'OtpLog_expiresAt_ttl' }).catch(() => undefined)
  await db.collection('AdminUser').createIndex({ email: 1 }, { unique: true }).catch(() => undefined)
  await db.collection('WebUser').createIndex({ email: 1 }, { unique: true }).catch(() => undefined)
  await db.collection('ProductReview').createIndex({ productSlug: 1, userId: 1 }, { unique: true }).catch(() => undefined)
  await db.collection('ProductReview').createIndex({ productSlug: 1, status: 1, createdAt: -1 }).catch(() => undefined)
  await db.collection('Category').createIndex({ slug: 1 }, { unique: true }).catch(() => undefined)

  await db.collection('Category').updateMany(
    { status: { $exists: false } },
    { $set: { status: 'active', sortOrder: 100, updatedAt: now } }
  )

  const collections = [
    { name: 'Latest Trend', slug: 'latest-trend', sortOrder: 10, description: 'Newest designer chaniya choli looks.' },
    { name: 'Wedding', slug: 'wedding', sortOrder: 20, description: 'Bridal and wedding collection.' },
    { name: 'Engagement', slug: 'engagement', sortOrder: 30, description: 'Engagement ceremony outfits.' },
    { name: 'Navratri', slug: 'navratri', sortOrder: 40, description: 'Navratri festive collection.' },
    { name: 'Party', slug: 'party', sortOrder: 50, description: 'Party wear chaniya choli.' }
  ]

  for (const item of collections) {
    const exists = await db.collection('Category').findOne({ slug: item.slug })
    const payload = {
      name: item.name,
      slug: item.slug,
      description: item.description,
      imageUrl: '/images/brand/jagu-logo.png',
      imageName: 'jagu-logo',
      imageAlt: "Jagu's Designing",
      type: 'main',
      parentId: null,
      status: 'active',
      sortOrder: item.sortOrder,
      updatedAt: now
    }

    if (exists) {
      await db.collection('Category').updateOne({ slug: item.slug }, { $set: payload })
    } else {
      await db.collection('Category').insertOne({ ...payload, createdAt: now })
    }
  }

  console.log('Seeded admin user:', email)
  console.log('Seeded main collections:', collections.map(item => item.name).join(', '))

  const filterCount = await db.collection('CollectionFilter').countDocuments()

  if (filterCount === 0) {
    const { defaultFilters } = await import('../libs/filter-utils')

    await db.collection('CollectionFilter').insertMany(defaultFilters())
    console.log('Seeded collection filters')
  }
  await client.close()
}

seed().catch(error => {
  console.error(error)
  process.exit(1)
})
