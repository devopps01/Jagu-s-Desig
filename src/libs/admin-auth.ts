import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'

export type AdminUserDoc = {
  _id: ObjectId
  name: string
  email: string
  passwordHash: string
  role: string
}

export const loginAdminUser = async (email: string, password: string) => {
  const db = await getDb()
  const admin = await db.collection<AdminUserDoc>('AdminUser').findOne({
    email: email.trim().toLowerCase()
  })

  if (!admin) {
    return null
  }

  const valid = await bcrypt.compare(password, admin.passwordHash)

  if (!valid) {
    return null
  }

  return {
    id: admin._id.toHexString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    image: '/images/avatars/1.png'
  }
}
