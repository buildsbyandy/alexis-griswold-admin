import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import type { Database } from '@/types/supabase.generated'
import {
  createRecipeHeroVideo,
  getRecipeHeroVideos,
  type RecipeHeroVideoRow,
  type RecipeHeroVideoInsert,
} from '@/lib/services/recipeHeroService'
import { youtubeService } from '../../../lib/services/youtubeService'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const videos = await getRecipeHeroVideos()
      return res.status(200).json({ videos: videos as RecipeHeroVideoRow[] })
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
        link_url,
        caption,
        video_description,
        order_index,
        video_thumbnail_url,
        video_type,
        is_active
      } = req.body as Partial<RecipeHeroVideoInsert>

      if (!link_url) {
        return res.status(400).json({ error: 'YouTube URL is required' })
      }

      // Validate using shared YouTube service
      if (!youtubeService.validate_youtube_url(link_url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL format' })
      }

      // Default order to 0 if not provided
      const normalizedOrder = typeof order_index === 'number' ? order_index : 0

      // Pull metadata from YouTube (title/thumbnail/duration) when available
      let resolvedCaption = caption
      let thumbnailUrl = video_thumbnail_url ?? null
      let derivedType: string | null = null
      try {
        const meta = await youtubeService.get_video_data_from_url(link_url)
        if (meta && meta.data) {
          const vd = meta.data
          if (!resolvedCaption?.trim()) resolvedCaption = vd.title
          if (!thumbnailUrl) thumbnailUrl = vd.thumbnail_url
          // Heuristic: treat as short if URL uses /shorts/ or duration <= 75s
          const isShortUrl = /\/shorts\//.test(link_url)
          const mmss = (vd.duration || '').split(':').map(Number)
          const seconds = mmss.length === 2 ? (mmss[0] || 0) * 60 + (mmss[1] || 0) : (mmss[0] || 0)
          derivedType = (isShortUrl || seconds <= 75) ? 'short' : 'video'
        }
      } catch {}

      const created = await createRecipeHeroVideo({
        link_url,
        caption: resolvedCaption,
        video_description: video_description ?? null,
        order_index: normalizedOrder,
        video_thumbnail_url: thumbnailUrl,
        video_type: video_type ?? derivedType ?? 'video',
        is_active: is_active ?? true
      })
      
      return res.status(201).json({ video: created as RecipeHeroVideoRow })
    } catch (error) {
      console.error('Error creating recipe hero video:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}