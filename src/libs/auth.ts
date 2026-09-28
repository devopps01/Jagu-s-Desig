import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import type { Provider } from 'next-auth/providers/index'

import { loginAdminUser } from '@/libs/admin-auth'

const providers: Provider[] = [
  CredentialProvider({
    name: 'Credentials',
    type: 'credentials',
    credentials: {},
    async authorize(credentials) {
      const { email, password } = credentials as { email: string; password: string }
      const admin = await loginAdminUser(email, password)

      if (!admin) {
        throw new Error(JSON.stringify({ message: ['Email or Password is invalid'] }))
      }

      return admin
    }
  })
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.email = user.email
        token.sub = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
      }

      return session
    }
  }
}
