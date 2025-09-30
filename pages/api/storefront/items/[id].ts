import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import { updateCarouselItemDB, deleteCarouselItemDB, findCarouselByPageSlugDB } from '../../../../lib/db/carousels'
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

      // Build update payload
      const update: any = {}
      if (order_index !== undefined) update.order_index = order_index

      // Handle slug change by looking up the target carousel
      if (slug) {
        const car = await findCarouselByPageSlugDB('storefront', slug)
        if (car.error || !car.data) return res.status(404).json({ error: car.error || 'Target carousel not found' })
        update.carousel_id = car.data.id
      }

      const updated = await updateCarouselItemDB(id, update)
      if (updated.error) return res.status(500).json({ error: updated.error })
      return res.status(200).json({ item: updated.data })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteCarouselItemDB(id)
      if (deleted.error) return res.status(500).json({ error: deleted.error })
      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}


