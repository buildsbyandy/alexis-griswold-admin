import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

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
      const { carousel_id, page, slug } = req.query

      if (carousel_id && typeof carousel_id === 'string') {
        // Get items for specific carousel
        const { data, error } = await supabase
          .from('carousel_items')
          .select('*')
          .eq('carousel_id', carousel_id)
          .eq('is_active', true) // Only return active items for public consumption
          .order('order_index', { ascending: true })

        if (error) {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ data: data || [] })
      }

      if (page && typeof page === 'string') {
        // Get view items with carousel metadata
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

      const { data, error } = await supabase.from('carousel_items').insert(input).select('*').single()
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ data })
    } catch (error) {
      console.error('Error creating carousel item:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}