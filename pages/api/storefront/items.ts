import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import { findCarouselByPageSlugDB, createCarouselDB, createCarouselItemDB } from '../../../lib/db/carousels'
import supabaseAdmin from '@/lib/supabase'
import { z } from 'zod'

export const config = { runtime: 'nodejs' }

type Slug = 'storefront-favorites' | 'storefront-top-picks'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const slug = (req.query.slug as Slug) || 'storefront-favorites'
      if (slug !== 'storefront-favorites' && slug !== 'storefront-top-picks') return res.status(400).json({ error: 'Invalid slug' })

      // Get carousel items for this storefront slug using direct DB queries
      const { data: carouselItems, error: itemsError } = await supabaseAdmin
        .from('carousel_items')
        .select(`*, carousels!inner(page, slug)`)
        .eq('carousels.page', 'storefront')
        .eq('carousels.slug', slug)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (itemsError) return res.status(500).json({ error: itemsError.message })

      const refIds = (carouselItems || []).map(i => i.ref_id).filter(Boolean) as string[]

      // Fetch product metadata
      let products: any[] = []
      if (refIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('storefront_products')
          .select('*')
          .in('id', refIds)
        if (!error) products = data || []
      }

      const byId = new Map<string, any>()
      for (const p of products) byId.set(p.id, p)

      const items = (carouselItems || []).map(item => {
        const p = item.ref_id ? byId.get(item.ref_id) : null
        return {
          id: item.id,
          carousel_slug: slug,
          order_index: item.order_index,
          ref_id: item.ref_id,
          caption: item.caption || (p?.product_title ?? null),
          product_title: p?.product_title ?? null,
          image_path: p?.image_path ?? null,
          amazon_url: p?.amazon_url ?? null,
        }
      })

      return res.status(200).json({ items })
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
        slug: z.enum(['storefront-favorites','storefront-top-picks']).optional(),
        order_index: z.number().int().min(0).optional(),
      })
      const { product_id, slug, order_index } = BodySchema.parse(req.body)
      const targetSlug: Slug = slug === 'storefront-top-picks' ? 'storefront-top-picks' : 'storefront-favorites'

      // Ensure carousel exists
      let car = await findCarouselByPageSlugDB('storefront', targetSlug)
      if (car.error) return res.status(500).json({ error: car.error })
      if (!car.data) {
        const created = await createCarouselDB({ page: 'storefront', slug: targetSlug, is_active: true })
        if (created.error) return res.status(500).json({ error: created.error })
        car = { data: created.data }
      }

      const insert = {
        carousel_id: car.data!.id,
        kind: 'product' as const,
        ref_id: product_id,
        caption: null,
        order_index: order_index ?? 0,
        is_active: true,
      }

      const created = await createCarouselItemDB(insert)
      if (created.error) return res.status(500).json({ error: created.error })
      return res.status(201).json({ item: created.data })
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}


