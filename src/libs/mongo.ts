import { setServers } from 'node:dns'
import { setDefaultAutoSelectFamily } from 'node:net'

import { MongoClient, type Db } from 'mongodb'

setDefaultAutoSelectFamily(false)

const LOCAL_URI = 'mongodb://127.0.0.1:27017/jagu_design'
const uri = process.env.DATABASE_URL || LOCAL_URI

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient
  mongoReady?: Promise<MongoClient>
  dnsReady?: boolean
  mongoDownUntil?: number
  mongoDownError?: unknown
  mongoFallbackWarned?: boolean
}

/** Windows DNS often times out on Atlas SRV lookups (querySrv ETIMEOUT). */
const usePublicDnsForSrv = () => {
  if (globalForMongo.dnsReady || !uri.startsWith('mongodb+srv')) return

  setServers(['8.8.8.8', '1.1.1.1'])
  globalForMongo.dnsReady = true
}

const connectionTargets = () => {
  if (uri === LOCAL_URI || uri.includes('127.0.0.1') || uri.includes('localhost')) return [uri]

  return [uri, LOCAL_URI]
}

const connectTarget = async (target: string) => {
  if (target.startsWith('mongodb+srv')) usePublicDnsForSrv()

  const remote = target.startsWith('mongodb+srv')
  const client = new MongoClient(target, {
    serverSelectionTimeoutMS: remote ? 8000 : 3000,
    connectTimeoutMS: remote ? 8000 : 3000,
    family: 4
  })

  try {
    return await client.connect()
  } catch (error) {
    await client.close().catch(() => undefined)
    throw error
  }
}

const connectFastest = async () => {
  const targets = connectionTargets()
  let chosen = false

  const attempts = targets.map(async target => {
    const connected = await connectTarget(target)

    if (chosen) {
      await connected.close().catch(() => undefined)
      throw new Error('unused connection')
    }

    chosen = true

    if (target !== uri && !globalForMongo.mongoFallbackWarned) {
      globalForMongo.mongoFallbackWarned = true
      console.warn('MongoDB Atlas is unreachable. Using the local database so pages can load.')
    }

    return connected
  })

  try {
    return await Promise.any(attempts)
  } catch (error) {
    const errors = error instanceof AggregateError ? error.errors : [error]
    const real = errors.find(item => !(item instanceof Error && item.message === 'unused connection'))

    throw real || error
  }
}

const getClient = async () => {
  if (globalForMongo.mongoClient) {
    return globalForMongo.mongoClient
  }

  if (globalForMongo.mongoDownUntil && Date.now() < globalForMongo.mongoDownUntil && globalForMongo.mongoDownError) {
    throw globalForMongo.mongoDownError
  }

  if (!globalForMongo.mongoReady) {
    globalForMongo.mongoReady = connectFastest()
      .then(connected => {
        globalForMongo.mongoClient = connected
        globalForMongo.mongoDownUntil = undefined
        globalForMongo.mongoDownError = undefined

        return connected
      })
      .catch(error => {
        globalForMongo.mongoReady = undefined
        globalForMongo.mongoClient = undefined
        globalForMongo.mongoDownError = error
        globalForMongo.mongoDownUntil = Date.now() + 10000
        throw error
      })
  }

  return globalForMongo.mongoReady
}

export const getDb = async (): Promise<Db> => {
  const client = await getClient()

  return client.db()
}
