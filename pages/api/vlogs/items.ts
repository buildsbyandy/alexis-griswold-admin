import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import { listViewItems, findCarouselByPageSlug, createCarousel, createCarouselItem } from '../../../lib/services/carouselService'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

const VLOG_SLUGS = ['main-channel', 'ag-vlogs'] as const
type VlogSlug = typeof VLOG_SLUGS[number]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const itemsRes = await listViewItems('vlogs')
      if (itemsRes.error) return res.status(500).json({ error: itemsRes.error })
      const items = (itemsRes.data || []).filter(i => (i.kind === 'video') && (i.carousel_slug && (VLOG_SLUGS as readonly string[]).includes(i.carousel_slug)))

      // Pull vlog metadata by ref_id
      const refIds = items.map(i => i.ref_id).filter(Boolean) as string[]
      const { data: vlogs } = await supabaseAdmin.from('vlogs').select('*').in('id', refIds)
      const vlogById = new Map<string, any>()
      for (const v of vlogs || []) vlogById.set(v.id, v)

      const normalized = items
        .sort((a, b) => (a.carousel_slug === 'main-channel' ? 0 : 1) - (b.carousel_slug === 'main-channel' ? 0 : 1) || (a.order_index || 0) - (b.order_index || 0))
        .map(i => {
          const v = i.ref_id ? vlogById.get(i.ref_id) : null
          return {
            id: i.id,
            carousel_slug: i.carousel_slug,
            order_index: i.order_index,
            ref_id: i.ref_id,
            title: v?.title || i.caption || '',
            description: v?.description || '',
            youtube_url: v?.youtube_url || '',
            thumbnail_url: v?.thumbnail_url || '',
          }
        })

      return res.status(200).json({ items: normalized })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

    try {
      const { ref_id, carousel_slug, order_index, caption } = req.body as {
        ref_id?: string
        carousel_slug?: VlogSlug
        order_index?: number
        caption?: string | null
      }

      if (!ref_id) return res.status(400).json({ error: 'ref_id is required' })
      const slug = (carousel_slug && (VLOG_SLUGS as readonly string[]).includes(carousel_slug)) ? carousel_slug : 'main-channel'
      let car = await findCarouselByPageSlug('vlogs', slug)
      if (car.error) return res.status(500).json({ error: car.error })
      if (!car.data) {
        const created = await createCarousel({ page: 'vlogs', slug, is_active: true })
        if (created.error) return res.status(500).json({ error: created.error })
        car = { data: created.data }
      }

      const idx = typeof order_index === 'number' ? order_index : 0
      const inserted = await createCarouselItem({ carousel_id: car.data!.id, kind: 'video', order_index: idx, ref_id, caption: caption ?? null, is_active: true })
      if (inserted.error) return res.status(500).json({ error: inserted.error })
      return res.status(201).json({ item: inserted.data })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}


