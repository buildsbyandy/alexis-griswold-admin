import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all recipe hero videos ordered by video_order
      const { data, error } = await supabaseAdmin
        .from('recipe_hero_videos')
        .select('*')
        .order('video_order', { ascending: true })
      
      if (error) {
        console.error('Error fetching recipe hero videos:', error)
        return res.status(500).json({ error: 'Failed to fetch recipe hero videos' })
      }
      
      return res.status(200).json({ videos: data || [] })
    } catch (error) {
      console.error('Error in recipe hero videos API:', error)
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
      const {
        youtube_url,
        video_title,
        video_description,
        video_order,
        video_thumbnail_url,
        video_type,
        is_active
      } = req.body

      if (!youtube_url) {
        return res.status(400).json({ error: 'YouTube URL is required' })
      }

      // Validate YouTube URL format
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w\-]+/
      if (!youtubeRegex.test(youtube_url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL format' })
      }

      // Extract video ID for thumbnail if not provided
      let thumbnailUrl = video_thumbnail_url
      if (!thumbnailUrl) {
        const videoIdMatch = youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)
        if (videoIdMatch) {
          const videoId = videoIdMatch[1]
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }
      }

      const { data, error } = await supabaseAdmin
        .from('recipe_hero_videos')
        .insert({
          youtube_url,
          video_title: video_title || null,
          video_description: video_description || null,
          video_order: video_order || 1,
          video_thumbnail_url: thumbnailUrl,
          video_type: video_type || 'reel',
          is_active: is_active !== undefined ? is_active : true
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating recipe hero video:', error)
        return res.status(500).json({ error: 'Failed to create recipe hero video' })
      }
      
      return res.status(201).json({ video: data })
    } catch (error) {
      console.error('Error creating recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}