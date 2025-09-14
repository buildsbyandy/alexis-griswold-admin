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
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('vlogs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Failed to fetch vlogs' })
    return res.status(200).json({ vlogs: data as VlogRow[] })
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    try {
      const { youtube_url, carousel, title: customTitle, description: customDescription, is_featured, display_order } = req.body

      // Validate required fields
      if (!youtube_url) {
        return res.status(400).json({ error: 'YouTube URL is required' })
      }

      if (!carousel) {
        return res.status(400).json({ error: 'Carousel selection is required' })
      }

      // Validate YouTube URL format
      if (!youtubeService.isValidYouTubeUrl(youtube_url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL format' })
      }

      // Extract video metadata from YouTube
      const youtubeData = await youtubeService.getVideoDataFromUrl(youtube_url)
      if (!youtubeData) {
        return res.status(404).json({ error: 'Video not found or private' })
      }

      // Prepare vlog data - use custom title/description if provided, otherwise use YouTube data
      const vlogData: VlogInsert = {
        title: customTitle?.trim() || youtubeData.title,
        description: customDescription?.trim() || youtubeData.description,
        youtube_url: youtube_url,
        thumbnail_url: youtubeData.thumbnailUrl,
        published_at: youtubeData.publishedAt,
        duration: youtubeData.duration,
        carousel: carousel,
        is_featured: is_featured || false,
        display_order: display_order || 0
      }
      
      const { data, error } = await supabaseAdmin
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
      
      return res.status(201).json({
        vlog: data as VlogRow,
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