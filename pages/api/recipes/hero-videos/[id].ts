import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import type { Database } from '@/types/supabase.generated'
import {
  getRecipeHeroVideoById,
  updateRecipeHeroVideo,
  deleteRecipeHeroVideo,
  type RecipeHeroVideoRow,
  type RecipeHeroVideoUpdate
} from '../../../../lib/services/recipeHeroService'
import { youtubeService } from '../../../../lib/services/youtubeService'

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
      const video = await getRecipeHeroVideoById(id)
      if (!video) return res.status(404).json({ error: 'Video not found' })
      return res.status(200).json({ video: video as RecipeHeroVideoRow })
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
      } = req.body as Partial<RecipeHeroVideoUpdate>

      // Validate YouTube URL if provided
      if (youtube_url && !youtubeService.isValidYouTubeUrl(youtube_url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL format' })
      }

      const updatePayload: RecipeHeroVideoUpdate & { updated_at?: string } = {
        youtube_url,
        video_title,
        video_description,
        video_order,
        video_thumbnail_url,
        video_type,
        is_active,
        updated_at: new Date().toISOString(),
      }

      // Auto-generate thumbnail if YouTube URL changed but no thumbnail provided
      if (youtube_url && !video_thumbnail_url) {
        try {
          const meta = await youtubeService.getVideoDataFromUrl(youtube_url)
          if (meta && meta.data && meta.data.thumbnail_url) {
            updatePayload.video_thumbnail_url = meta.data.thumbnail_url
          }
        } catch {}
      }

      const updated = await updateRecipeHeroVideo(id, updatePayload)
      if (!updated) return res.status(404).json({ error: 'Video not found' })
      return res.status(200).json({ video: updated as RecipeHeroVideoRow })
    } catch (error) {
      console.error('Error updating recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteRecipeHeroVideo(id)
      return res.status(200).json({ message: 'Video deleted successfully' })
    } catch (error) {
      console.error('Error deleting recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}