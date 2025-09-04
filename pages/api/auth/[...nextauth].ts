import NextAuth, { type NextAuthOptions } from 'next-auth'
import { encode } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '../../../lib/prisma'

const AUTHORIZED_ADMINS = (process.env.ALLOWED_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  },
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
  session: { 
    strategy: 'jwt', 
    maxAge: 4 * 60 * 60, // 4 hours for admin security
    updateAge: 1 * 60 * 60, // Update session every 1 hour if active
  },
  jwt: { 
    maxAge: 4 * 60 * 60, // 4 hours
    // Add extra security claims
    encode: async ({ token, secret }) => {
      // Add timestamp for additional security checks
      if (token) {
        (token as any).lastActivity = Math.floor(Date.now() / 1000);
      }
      return encode({ token, secret });
    },
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Session expires when browser closes (no persistent cookie)
        maxAge: undefined, 
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback:', { user: user?.email, provider: account?.provider })
      console.log('AUTHORIZED_ADMINS raw:', process.env.ALLOWED_ADMIN_EMAILS)
      console.log('AUTHORIZED_ADMINS parsed:', AUTHORIZED_ADMINS)
      
      if (account?.provider !== 'google') {
        console.log('Provider is not Google:', account?.provider)
        return false
      }
      const email = (user.email || '').toLowerCase()
      const isAuthorized = !!email && AUTHORIZED_ADMINS.includes(email)
      console.log('Authorization check:', { 
        email, 
        isAuthorized, 
        allowedEmails: AUTHORIZED_ADMINS,
        emailLength: email.length,
        allowedEmailsLength: AUTHORIZED_ADMINS.length
      })
      return isAuthorized
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
  debug: true, // Enable debug mode to see what's failing
}

export default NextAuth(authOptions)

