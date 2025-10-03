import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'
import { getCarouselItemsDB, createCarouselItemDB } from '@/lib/db/carousels'

export type CarouselItemRow = Database['public']['Tables']['carousel_items']['Row']
export type CarouselItemInsert = Database['public']['Tables']['carousel_items']['Insert']
export type CarouselItemUpdate = Database['public']['Tables']['carousel_items']['Update']
export type PageType = Database['public']['Enums']['page_type']

// Extended type for carousel items with carousel metadata
export type VCarouselItemRow = CarouselItemRow & {
  carousel_slug?: string | null;
  page?: PageType | null;
  carousels?: {
    page: PageType;
    slug: string;
  } | null;
}

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { carousel_id, page, slug, use_view } = req.query

      if (carousel_id && typeof carousel_id === 'string') {
        // Get items for specific carousel using DB function
        const result = await getCarouselItemsDB(carousel_id)

        if (result.error) {
          return res.status(500).json({ error: result.error })
        }

        return res.status(200).json({ data: result.data || [] })
      }

      if (page && typeof page === 'string') {
        // Check if we should use the v_carousel_items view for mixed content
        if (use_view === 'true') {
          let query = supabase
            .from('v_carousel_items')
            .select('*')
            .eq('carousel_page', page as PageType)
            .eq('item_is_active', true) // Only return active items

          if (slug && typeof slug === 'string') {
            query = query.eq('carousel_slug', slug)
          }

          const { data, error } = await query.order('item_order_index', { ascending: true })
          if (error) {
            return res.status(500).json({ error: error.message })
          }

          return res.status(200).json({ data: data || [] })
        } else {
          // Original logic for backward compatibility
          let query = supabase
            .from('carousel_items')
            .select(`
              *,
              carousels!inner(page, slug)
            `)
            .eq('carousels.page', page as PageType)
            .eq('is_active', true) // Only return active items for public consumption

          if (slug && typeof slug === 'string') {
            query = query.eq('carousels.slug', slug)
          }

          const { data, error } = await query.order('order_index', { ascending: true })
          if (error) {
            return res.status(500).json({ error: error.message })
          }

          // Transform the joined data to match the expected format
          const transformed = (data || []).map(item => ({
            ...item,
            carousel_slug: item.carousels?.slug || null,
            page: item.carousels?.page || null
          }))

          return res.status(200).json({ data: transformed })
        }
      }

      return res.status(400).json({ error: 'Either carousel_id or page parameter is required' })
    } catch (error) {
      console.error('Error fetching carousel items:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const input = req.body as CarouselItemInsert

      if (!input.carousel_id) {
        return res.status(400).json({ error: 'carousel_id is required' })
      }

      // Validate based on the kind of content being created
      const kind = input.kind

      if (kind === 'video') {
        if (!input.youtube_id) {
          return res.status(400).json({
            error: 'Video carousel items must have a youtube_id.'
          })
        }
      } else if (kind === 'album') {
        if (!input.album_id) {
          return res.status(400).json({
            error: 'Album carousel items must have an album_id.'
          })
        }
      } else if (kind === 'recipe' || kind === 'product') {
        if (!input.ref_id) {
          return res.status(400).json({
            error: `${kind} carousel items must have a ref_id.`
          })
        }
      } else if (kind === 'playlist') {
        if (!input.ref_id) {
          return res.status(400).json({
            error: 'Playlist carousel items must have a ref_id.'
          })
        }
      } else if (kind === 'tiktok' || kind === 'external') {
        if (!input.link_url) {
          return res.status(400).json({
            error: `${kind} carousel items must have a link_url.`
          })
        }
      } else {
        return res.status(400).json({
          error: `Unknown carousel item kind: ${kind}`
        })
      }

      const result = await createCarouselItemDB(input)
      if (result.error) {
        // Check for database constraint violations
        if (result.error?.includes('check constraint') && result.error?.includes('youtube_album_exclusivity')) {
          return res.status(400).json({
            error: 'Database constraint violation: Cannot assign both YouTube video and album to the same carousel item.'
          })
        }
        return res.status(500).json({ error: result.error })
      }

      return res.status(201).json({ data: result.data })
    } catch (error) {
      console.error('Error creating carousel item:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}