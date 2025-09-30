import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import { updateStorefrontItem, deleteStorefrontItem } from '../../../../lib/services/carouselService'
import { z } from 'zod'

export const config = { runtime: 'nodejs' }

type Slug = 'storefront-favorites' | 'storefront-top-picks'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Item ID required' })

  if (req.method === 'PUT') {
    try {
      const BodySchema = z.object({
        order_index: z.number().int().min(0).optional(),
        slug: z.enum(['storefront-favorites','storefront-top-picks']).optional(),
      })
      const { order_index, slug } = BodySchema.parse(req.body)
      const updated = await updateStorefrontItem(id, { order_index, slug: slug as Slug | undefined })
      if (updated.error) return res.status(500).json({ error: updated.error })
      return res.status(200).json({ item: updated.data })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteStorefrontItem(id)
      if (deleted.error) return res.status(500).json({ error: deleted.error })
      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}


