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
      if (display_order !== undefined) updateData.display_order = display_order

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
    const { error } = await supabaseAdmin
      .from('vlogs')
      .delete()
      .eq('id', id)
    
    if (error) return res.status(500).json({ error: 'Failed to delete vlog' })
    return res.status(200).json({ message: 'Vlog deleted successfully' })
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}