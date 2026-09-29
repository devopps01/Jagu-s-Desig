import { MongoClient, type Db } from 'mongodb'

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/jagu_design'

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient
  mongoReady?: Promise<MongoClient>
}

const getClient = async () => {
  if (globalForMongo.mongoClient) {
    return globalForMongo.mongoClient
  }

  if (!globalForMongo.mongoReady) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      family: 4
    })

    globalForMongo.mongoReady = client.connect().then(
      connected => {
        globalForMongo.mongoClient = connected

        return connected
      },
      error => {
        globalForMongo.mongoReady = undefined
        globalForMongo.mongoClient = undefined

        throw error
      }
    )
  }

  return globalForMongo.mongoReady
}

export const getDb = async (): Promise<Db> => {
  const client = await getClient()

  return client.db()
}
