import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'web_session'

const getSecret = () => {
  const secret = process.env.WEB_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'web-dev-secret'

  return new TextEncoder().encode(secret)
}

export const createWebSession = async (payload: { id: string; email: string }) => {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())

  const jar = await cookies()

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export const clearWebSession = async () => {
  const jar = await cookies()

  jar.delete(COOKIE_NAME)
}

export const getWebSession = async () => {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())

    return {
      id: String(payload.id),
      email: String(payload.email)
    }
  } catch {
    return null
  }
}
