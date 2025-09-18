import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import { listStorefrontItems, createStorefrontItem } from '../../../lib/services/carouselService'
import { z } from 'zod'

export const config = { runtime: 'nodejs' }

type Slug = 'favorites' | 'top-picks'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const slug = (req.query.slug as Slug) || 'favorites'
      if (slug !== 'favorites' && slug !== 'top-picks') return res.status(400).json({ error: 'Invalid slug' })
      const result = await listStorefrontItems(slug)
      if (result.error) return res.status(500).json({ error: result.error })
      return res.status(200).json({ items: result.data || [] })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

    try {
      const BodySchema = z.object({
        product_id: z.string().min(1),
        slug: z.enum(['favorites','top-picks']).optional(),
        order_index: z.number().int().min(0).optional(),
      })
      const { product_id, slug, order_index } = BodySchema.parse(req.body)
      const targetSlug: Slug = slug === 'top-picks' ? 'top-picks' : 'favorites'
      const created = await createStorefrontItem(targetSlug, product_id, order_index)
      if (created.error) return res.status(500).json({ error: created.error })
      return res.status(201).json({ item: created.data })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}


