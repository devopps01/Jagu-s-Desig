import { ObjectId } from 'mongodb'
import { randomUUID } from 'crypto'

import { getDb } from '@/libs/mongo'
import { MAX_SAVED_ADDRESSES, type SavedAddress } from '@/libs/addresses-types'

export { MAX_SAVED_ADDRESSES, type SavedAddress } from '@/libs/addresses-types'

const empty: SavedAddress = {
  id: '',
  label: 'Home',
  name: '',
  phone: '',
  address: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false
}

const clean = (value: unknown) => String(value || '').trim()

const userFilter = (userId: string) => {
  if (!ObjectId.isValid(userId)) throw new Error('Please log in again to save addresses')

  return { _id: new ObjectId(userId) }
}

export const parseAddress = (body: Partial<SavedAddress> | Record<string, unknown>): SavedAddress => {
  const label = clean(body.label) || 'Home'
  const name = clean(body.name)
  const phone = clean(body.phone)
  const address = clean(body.address)
  const city = clean(body.city)
  const state = clean(body.state)
  const pincode = clean(body.pincode)

  if (!name || !phone || !address || !city || !state || !pincode) {
    throw new Error('Name, phone, house/street, city, state and pincode are required')
  }

  if (!/^\d{6}$/.test(pincode)) {
    throw new Error('Enter a valid 6-digit pincode')
  }

  return {
    id: clean(body.id),
    label,
    name,
    phone,
    address,
    locality: clean(body.locality),
    city,
    state,
    pincode,
    isDefault: Boolean(body.isDefault)
  }
}

export const listAddresses = async (userId: string): Promise<SavedAddress[]> => {
  const db = await getDb()
  const user = await db.collection('WebUser').findOne(userFilter(userId), { projection: { addresses: 1 } })
  const rows = Array.isArray(user?.addresses) ? (user.addresses as SavedAddress[]) : []

  return rows.map(row => ({ ...empty, ...row, id: row.id || randomUUID() }))
}

const saveList = async (userId: string, addresses: SavedAddress[]) => {
  const db = await getDb()
  const result = await db.collection('WebUser').updateOne(userFilter(userId), {
    $set: { addresses, updatedAt: new Date() }
  })

  if (!result.matchedCount) {
    throw new Error('Could not save address to your account. Please log in again.')
  }

  return addresses
}

const withDefault = (addresses: SavedAddress[], preferredId?: string) => {
  if (!addresses.length) return addresses

  const target = preferredId && addresses.some(item => item.id === preferredId) ? preferredId : addresses.find(item => item.isDefault)?.id || addresses[0].id

  return addresses.map(item => ({ ...item, isDefault: item.id === target }))
}

export const upsertAddress = async (userId: string, input: Partial<SavedAddress>) => {
  const parsed = parseAddress(input)
  const current = await listAddresses(userId)

  if (parsed.id) {
    const index = current.findIndex(item => item.id === parsed.id)

    if (index < 0) throw new Error('Address not found')

    current[index] = { ...parsed, id: parsed.id }

    return saveList(userId, withDefault(current, parsed.isDefault ? parsed.id : undefined))
  }

  if (current.length >= MAX_SAVED_ADDRESSES) {
    throw new Error(`You can save up to ${MAX_SAVED_ADDRESSES} locations`)
  }

  const next: SavedAddress = { ...parsed, id: randomUUID(), isDefault: parsed.isDefault || !current.length }

  return saveList(userId, withDefault([...current, next], next.isDefault ? next.id : undefined))
}

export const setDefaultAddress = async (userId: string, id: string) => {
  const current = await listAddresses(userId)

  if (!current.some(item => item.id === id)) throw new Error('Address not found')

  return saveList(userId, withDefault(current, id))
}

export const removeAddress = async (userId: string, id: string) => {
  const current = await listAddresses(userId).then(rows => rows.filter(item => item.id !== id))

  return saveList(userId, withDefault(current))
}
