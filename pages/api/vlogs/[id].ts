import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { youtubeService } from '../../../lib/services/youtubeService'
import type { Database } from '@/types/supabase.generated'

type VlogRow = Database['public']['Tables']['vlogs']['Row']
type VlogInsert = Database['public']['Tables']['vlogs']['Insert']
type VlogUpdate = Database['public']['Tables']['vlogs']['Update']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid vlog ID' })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('vlogs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Vlog not found' })
      return res.status(500).json({ error: 'Failed to fetch vlog' })
    }
    return res.status(200).json({ vlog: data as VlogRow })
  }

  if (req.method === 'PUT') {
    try {
      const { youtube_url, title: customTitle, description: customDescription, carousel, is_featured, display_order } = req.body

      let updateData: VlogUpdate = {
        updated_at: new Date().toISOString()
      }

      // If YouTube URL is being updated, extract fresh metadata
      if (youtube_url) {
        // Validate YouTube URL format
        if (!youtubeService.validate_youtube_url(youtube_url)) {
          return res.status(400).json({ error: 'Invalid YouTube URL format' })
        }
        
        // Extract video metadata from YouTube
        const youtubeData = await youtubeService.get_video_data_from_url(youtube_url)
        if (!youtubeData || youtubeData.error || !youtubeData.data) {
          return res.status(404).json({ error: 'Video not found or private' })
        }
        const vd = youtubeData.data
        
        updateData = {
          ...updateData,
          youtube_url: youtube_url,
          youtube_id: vd.video_id, // Include the YouTube video ID
          thumbnail_url: vd.thumbnail_url,
          published_at: vd.published_at,
          duration: vd.duration,
          title: customTitle?.trim() || vd.title,
          description: customDescription?.trim() || vd.description,
        }
      } else {
        // Update only provided fields without YouTube data
        if (customTitle !== undefined) updateData.title = customTitle
        if (customDescription !== undefined) updateData.description = customDescription
      }

      // Update other fields if provided
      if (carousel !== undefined) updateData.carousel = carousel
      if (is_featured !== undefined) updateData.is_featured = is_featured

      // Handle display_order with duplicate validation
      if (display_order !== undefined) {
        // Check for duplicate display_order (excluding current vlog)
        const { data: duplicateCheck } = await supabaseAdmin
          .from('vlogs')
          .select('id')
          .eq('display_order', display_order)
          .neq('id', id)
          .limit(1)

        if (duplicateCheck && duplicateCheck.length > 0) {
          return res.status(400).json({
            error: `Display order ${display_order} is already in use. Please choose a different number.`
          })
        }
        updateData.display_order = display_order
      }

      const { data, error } = await supabaseAdmin
        .from('vlogs')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) {
        console.error('Database error updating vlog:', error)
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Vlog not found' })
        return res.status(500).json({ error: 'Failed to update vlog' })
      }

      // If carousel is being updated, ensure carousel item exists
      if (carousel !== undefined) {
        const slug = carousel === 'ag-vlogs' ? 'ag-vlogs' : 'main-channel'
        
        // Check if carousel item already exists
        const { data: existingItem } = await supabaseAdmin
          .from('carousel_items')
          .select('id')
          .eq('ref_id', id)
          .eq('kind', 'video')
          .single()

        if (!existingItem) {
          // Create carousel item if it doesn't exist
          const { findCarouselByPageSlug, createCarousel, createCarouselItem } = await import('../../../lib/services/carouselService')
          
          let car = await findCarouselByPageSlug('vlogs', slug)
          if (car.error) {
            console.error('Error finding carousel:', car.error)
          } else if (!car.data) {
            const created = await createCarousel({ page: 'vlogs', slug, is_active: true })
            if (created.error) {
              console.error('Error creating carousel:', created.error)
            } else {
              car = { data: created.data }
            }
          }

          if (car.data) {
            const order_index = typeof display_order === 'number' ? display_order : 0
            const caption = data.title || null
            const itemRes = await createCarouselItem({
              carousel_id: car.data.id,
              kind: 'video',
              order_index,
              ref_id: id,
              caption,
              is_active: true,
            })
            if (itemRes.error) {
              console.error('Error creating carousel item:', itemRes.error)
            }
          }
        }
      }
      
      return res.status(200).json({
        vlog: data as VlogRow,
        message: youtube_url ? 'Vlog updated successfully with YouTube metadata' : 'Vlog updated successfully'
      })
    } catch (error) {
      console.error('Error updating vlog:', error)
      if (error instanceof Error) {
        return res.status(500).json({ 
          error: 'Failed to update vlog',
          details: error.message 
        })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First, delete any carousel items that reference this vlog
      const { error: carouselItemsError } = await supabaseAdmin
        .from('carousel_items')
        .delete()
        .eq('ref_id', id)
        .eq('kind', 'video')
      
      if (carouselItemsError) {
        console.error('Error deleting carousel items:', carouselItemsError)
        // Continue with vlog deletion even if carousel items deletion fails
      }

      // Then delete the vlog itself
      const { error } = await supabaseAdmin
        .from('vlogs')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting vlog:', error)
        return res.status(500).json({ error: 'Failed to delete vlog' })
      }
      
      return res.status(200).json({ message: 'Vlog and associated carousel items deleted successfully' })
    } catch (error) {
      console.error('Error in vlog deletion:', error)
      return res.status(500).json({ 
        error: 'Failed to delete vlog',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}