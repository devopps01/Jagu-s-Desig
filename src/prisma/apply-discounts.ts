import { MongoClient } from 'mongodb'

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/jagu_design'

const randomOff = () => 12 + Math.floor(Math.random() * 19)

const withMrp = (price: number) => {
  if (!price) return 0
  const off = randomOff()

  return Math.round(price / (1 - off / 100))
}

const run = async () => {
  const client = new MongoClient(uri)

  await client.connect()

  const db = client.db()
  const products = await db.collection('Product').find({}).toArray()

  for (const product of products) {
    const sellingPrice = Number(product.sellingPrice) || 0
    const rentPrice = Number(product.rentPrice) || 0

    await db.collection('Product').updateOne(
      { _id: product._id },
      {
        $set: {
          sellingMrp: sellingPrice ? withMrp(sellingPrice) : 0,
          rentMrp: rentPrice ? withMrp(rentPrice) : 0,
          updatedAt: new Date()
        }
      }
    )
  }

  console.log(`Applied random discounts to ${products.length} products`)
  await client.close()
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
