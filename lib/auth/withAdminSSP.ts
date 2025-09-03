import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import isAdminEmail from './isAdminEmail'

export function withAdminSSP(gssp: GetServerSideProps): GetServerSideProps {
  return async (ctx: GetServerSidePropsContext) => {
    const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
    const email = (session?.user as any)?.email || null
    if (!isAdminEmail(email)) {
      return { redirect: { destination: '/auth/signin', permanent: false } } as any
    }
    return await gssp(ctx)
  }
}

export default withAdminSSP

