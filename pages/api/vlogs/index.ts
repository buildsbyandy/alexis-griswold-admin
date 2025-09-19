import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { youtubeService } from '../../../lib/services/youtubeService'
import { findCarouselByPageSlug, createCarousel, createCarouselItem } from '../../../lib/services/carouselService'
import type { Database } from '@/types/supabase.generated'

type VlogRow = Database['public']['Tables']['vlogs']['Row']
type VlogInsert = Database['public']['Tables']['vlogs']['Insert']
type VlogUpdate = Database['public']['Tables']['vlogs']['Update']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch vlogs and enrich with carousel assignment from carousel_items
      const { data: vlogRows, error: vlogError } = await supabaseAdmin
        .from('vlogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (vlogError) {
        console.error('Error fetching vlogs:', vlogError)
        return res.status(500).json({ error: 'Failed to fetch vlogs' })
      }

      // Get carousel items for vlogs page directly from database
      // This shows which vlogs are featured in carousels and their order
      const { data: carouselItems, error: itemsError } = await supabaseAdmin
        .from('carousel_items')
        .select(`
          *,
          carousels!inner(page, slug)
        `)
        .eq('carousels.page', 'vlogs')
        .order('order_index', { ascending: true })

      if (itemsError) {
        console.error('Error fetching carousel items:', itemsError)
        return res.status(500).json({ error: 'Failed to fetch carousel items' })
      }

      // Create lookup map for carousel items
      // This allows us to see which vlogs are in carousels and their display order
      const itemByRef = new Map<string, any>()
      for (const item of carouselItems || []) {
        if (item?.ref_id) {
          itemByRef.set(item.ref_id, {
            ...item,
            carousel_slug: item.carousels?.slug || null,
            order_index: item.order_index || 0
          })
        }
      }

      // Map vlogs with carousel information
      // This gives us both the vlog data AND its carousel placement
      const result = (vlogRows as VlogRow[]).map((v) => {
        const it = itemByRef.get(v.id)
        const carouselSlug = it?.carousel_slug || null
        const display_order = it?.order_index ?? 0
        
        return {
          ...v,
          // Show which carousel this vlog appears in (if any)
          carousel: carouselSlug === 'ag-vlogs' ? 'ag-vlogs' : 'main-channel',
          // Show the display order within the carousel
          display_order,
          // Additional carousel metadata for admin interface
          is_in_carousel: !!it,
          carousel_slug: carouselSlug
        }
      })

      return res.status(200).json({ vlogs: result })
    } catch (error) {
      console.error('Error in vlogs GET:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    try {
      const { youtube_url, carousel, title: customTitle, description: customDescription, is_featured, display_order } = req.body as {
        youtube_url?: string
        carousel?: 'main-channel' | 'ag-vlogs'
        title?: string
        description?: string
        is_featured?: boolean
        display_order?: number
      }

      // Validate required fields
      if (!youtube_url) {
        return res.status(400).json({ error: 'YouTube URL is required' })
      }

      if (!carousel) {
        return res.status(400).json({ error: 'Carousel selection is required' })
      }

      // Validate YouTube URL format
      if (!youtubeService.validate_youtube_url(youtube_url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL format' })
      }

      // Extract video metadata from YouTube
      const youtubeData = await youtubeService.get_video_data_from_url(youtube_url)
      if (!youtubeData || youtubeData.error || !youtubeData.data) {
        return res.status(404).json({ error: 'Video not found or private' })
      }

      // Prepare vlog data - use custom title/description if provided, otherwise use YouTube data
      const vd = youtubeData.data
      const vlogData: VlogInsert = {
        title: customTitle?.trim() || vd.title,
        description: customDescription?.trim() || vd.description,
        youtube_url: youtube_url,
        youtube_id: vd.video_id, // Include the YouTube video ID
        thumbnail_url: vd.thumbnail_url,
        published_at: vd.published_at,
        duration: vd.duration,
        is_featured: is_featured || false,
      }

      const { data: createdVlog, error } = await supabaseAdmin
        .from('vlogs')
        .insert(vlogData)
        .select('*')
        .single()

      if (error) {
        console.error('Database error creating vlog:', error)
        return res.status(500).json({ 
          error: 'Failed to save vlog to database',
          details: error.message 
        })
      }

      // Ensure carousel exists
      const slug = carousel === 'ag-vlogs' ? 'ag-vlogs' : 'main-channel'
      let car = await findCarouselByPageSlug('vlogs', slug)
      if (car.error) return res.status(500).json({ error: car.error })
      if (!car.data) {
        const created = await createCarousel({ page: 'vlogs', slug, is_active: true })
        if (created.error) return res.status(500).json({ error: created.error })
        car = { data: created.data }
      }

      // Create carousel item referencing vlog
      const order_index = typeof display_order === 'number' ? display_order : 0
      const caption = createdVlog.title || null
      const itemRes = await createCarouselItem({
        carousel_id: car.data!.id,
        kind: 'video',
        order_index,
        ref_id: createdVlog.id,
        caption,
        is_active: true,
      })
      if (itemRes.error) return res.status(500).json({ error: itemRes.error })

      return res.status(201).json({
        vlog: { ...createdVlog, carousel: slug, display_order: order_index } as VlogRow,
        message: 'Vlog created successfully with YouTube metadata'
      })
      
    } catch (error) {
      console.error('Error creating vlog:', error)
      if (error instanceof Error) {
        return res.status(500).json({ 
          error: 'Failed to create vlog',
          details: error.message 
        })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}