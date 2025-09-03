import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma'

const AUTHORIZED_ADMINS = (process.env.ALLOWED_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false
      const email = (user.email || '').toLowerCase()
      return !!email && AUTHORIZED_ADMINS.includes(email)
    },
    async jwt({ token, user }) {
      if (user?.email) token.role = AUTHORIZED_ADMINS.includes(user.email.toLowerCase()) ? 'ADMIN' : 'USER'
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = (token as any).role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home page after successful sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/`
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)

