import { getDb } from '@/libs/mongo'

export type CustomerSuggestion = {
  name: string
  phone: string
  email: string
  source: 'rent' | 'user'
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const digitsOf = (value: string) => {
  const digits = value.replace(/\D/g, '')

  return digits.length > 10 ? digits.slice(-10) : digits
}

const personKey = (phone: string, email: string, name: string) => {
  const phoneKey = digitsOf(phone)

  if (phoneKey.length >= 6) return `p:${phoneKey}`

  const mail = email.trim().toLowerCase()

  if (mail) return `e:${mail}`

  return `n:${name.trim().toLowerCase()}`
}

type Draft = CustomerSuggestion & { score: number }

const prefer = (current: string, next: string, incomingWins: boolean) => {
  if (!current) return next
  if (!next) return current

  return incomingWins ? next : current
}

export const suggestCustomers = async (query: string): Promise<CustomerSuggestion[]> => {
  const text = query.trim().slice(0, 80)

  if (text.length < 2) return []

  const digits = text.replace(/\D/g, '')
  const nameRegex = new RegExp(escapeRegex(text), 'i')
  const phoneRegex = digits.length >= 3 ? new RegExp(digits.split('').map(escapeRegex).join('\\D*')) : null
  const db = await getDb()
  const rentOr: Record<string, RegExp>[] = [{ customerName: nameRegex }, { customerEmail: nameRegex }]
  const userOr: Record<string, RegExp>[] = [{ name: nameRegex }, { email: nameRegex }, { 'addresses.name': nameRegex }]

  if (phoneRegex) {
    rentOr.push({ customerPhone: phoneRegex })
    userOr.push({ phone: phoneRegex }, { 'addresses.phone': phoneRegex })
  }

  const [rentals, users] = await Promise.all([
    db
      .collection<{ customerName?: string; customerPhone?: string; customerEmail?: string }>('RentBooking')
      .find({ $or: rentOr }, { projection: { customerName: 1, customerPhone: 1, customerEmail: 1 } })
      .sort({ updatedAt: -1 })
      .limit(40)
      .toArray(),
    db
      .collection<{ name?: string; phone?: string; email?: string; addresses?: { name?: string; phone?: string }[] }>('WebUser')
      .find({ $or: userOr }, { projection: { name: 1, phone: 1, email: 1, addresses: 1 } })
      .limit(20)
      .toArray()
  ])

  const merged = new Map<string, Draft>()
  const add = (row: CustomerSuggestion, score: number) => {
    const name = row.name.trim()
    const phone = row.phone.trim()
    const email = row.email.trim()

    if (!name && !phone) return

    const key = personKey(phone, email, name)
    const current = merged.get(key)
    const incomingWins = !current || score > current.score

    merged.set(key, {
      name: prefer(current?.name || '', name, incomingWins),
      phone: prefer(current?.phone || '', phone, incomingWins),
      email: prefer(current?.email || '', email, incomingWins),
      source: current?.source === 'rent' || row.source === 'rent' ? 'rent' : 'user',
      score: Math.max(current?.score || 0, score)
    })
  }

  rentals.forEach(row => {
    add(
      {
        name: String(row.customerName || ''),
        phone: String(row.customerPhone || ''),
        email: String(row.customerEmail || ''),
        source: 'rent'
      },
      2
    )
  })

  users.forEach(row => {
    const address = row.addresses?.find(item => item?.name || item?.phone)

    add(
      {
        name: String(row.name || address?.name || ''),
        phone: String(row.phone || address?.phone || ''),
        email: String(row.email || ''),
        source: 'user'
      },
      1
    )
  })

  return [...merged.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map(({ name, phone, email, source }) => ({ name, phone, email, source }))
}
