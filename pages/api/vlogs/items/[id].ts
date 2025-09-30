import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import { updateCarouselItemDB, findCarouselByPageSlugDB, getCarouselItemsDB, deleteCarouselItemDB } from '../../../../lib/db/carousels'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Item ID required' })

  if (req.method === 'PUT') {
    try {
      const { order_index, carousel_slug } = req.body as { order_index?: number; carousel_slug?: 'vlogs-main-channel' | 'vlogs-ag-vlogs' }

      const update: any = {}
      if (typeof order_index === 'number') {
        if (order_index < 0) return res.status(400).json({ error: 'order_index must be >= 0' })
        update.order_index = order_index
      }

      if (carousel_slug) {
        const car = await findCarouselByPageSlugDB('vlogs', carousel_slug)
        if (car.error || !car.data) return res.status(404).json({ error: car.error || 'Target carousel not found' })

        if (typeof order_index === 'number') {
          const items = await getCarouselItemsDB(car.data.id)
          if (items.error) return res.status(500).json({ error: items.error })
          if ((items.data || []).some(i => i.order_index === order_index && i.id !== id)) {
            return res.status(409).json({ error: `order_index ${order_index} already taken in ${carousel_slug}` })
          }
        }

        update.carousel_id = car.data.id
      }

      update.updated_at = new Date().toISOString()

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


