import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'

export const requireAdminSession = async () => {
  const session = await getServerSession(authOptions)

  return session
}
