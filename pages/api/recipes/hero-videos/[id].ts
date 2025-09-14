import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Video ID required' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('recipe_hero_videos')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Video not found' })
        }
        console.error('Error fetching recipe hero video:', error)
        return res.status(500).json({ error: 'Failed to fetch recipe hero video' })
      }
      
      return res.status(200).json({ video: data })
    } catch (error) {
      console.error('Error in recipe hero video API:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
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

      // Validate YouTube URL if provided
      if (youtube_url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w\-]+/
        if (!youtubeRegex.test(youtube_url)) {
          return res.status(400).json({ error: 'Invalid YouTube URL format' })
        }
      }

      // Build update object with only provided fields
      const updateData: any = { updated_at: new Date().toISOString() }
      if (youtube_url !== undefined) updateData.youtube_url = youtube_url
      if (video_title !== undefined) updateData.video_title = video_title
      if (video_description !== undefined) updateData.video_description = video_description
      if (video_order !== undefined) updateData.video_order = video_order
      if (video_thumbnail_url !== undefined) updateData.video_thumbnail_url = video_thumbnail_url
      if (video_type !== undefined) updateData.video_type = video_type
      if (is_active !== undefined) updateData.is_active = is_active

      // Auto-generate thumbnail if YouTube URL changed but no thumbnail provided
      if (youtube_url && !video_thumbnail_url) {
        const videoIdMatch = youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)
        if (videoIdMatch) {
          const videoId = videoIdMatch[1]
          updateData.video_thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }
      }

      const { data, error } = await supabaseAdmin
        .from('recipe_hero_videos')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Video not found' })
        }
        console.error('Error updating recipe hero video:', error)
        return res.status(500).json({ error: 'Failed to update recipe hero video' })
      }
      
      return res.status(200).json({ video: data })
    } catch (error) {
      console.error('Error updating recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('recipe_hero_videos')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting recipe hero video:', error)
        return res.status(500).json({ error: 'Failed to delete recipe hero video' })
      }
      
      return res.status(200).json({ message: 'Video deleted successfully' })
    } catch (error) {
      console.error('Error deleting recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}