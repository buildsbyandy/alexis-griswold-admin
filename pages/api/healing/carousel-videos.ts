import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { youtubeService } from '../../../lib/services/youtubeService'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // All methods require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    // Add video to healing carousel with YouTube API integration
    try {
      const { page_type, carousel_number, youtube_url, video_title: customTitle, video_description: customDescription, video_order } = req.body

      // Validate required fields
      if (!youtube_url) {
        return res.status(400).json({ error: 'YouTube URL is required' })
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

      // First, find or create the carousel
      let { data: carousel, error: carouselError } = await supabaseAdmin
        .from('video_carousels')
        .select('*')
        .eq('page_type', page_type || 'healing')
        .eq('carousel_number', carousel_number || 1)
        .single()

      if (carouselError && carouselError.code === 'PGRST116') {
        // Carousel doesn't exist, create it
        const { data: newCarousel, error: createError } = await supabaseAdmin
          .from('video_carousels')
          .insert({
            page_type: page_type || 'healing',
            carousel_number: carousel_number || 1,
            header: `Carousel ${carousel_number || 1}`,
            subtitle: ''
          })
          .select('*')
          .single()

        if (createError) {
          console.error('Error creating carousel:', createError)
          return res.status(500).json({ error: 'Failed to create carousel' })
        }
        carousel = newCarousel
      } else if (carouselError) {
        console.error('Error finding carousel:', carouselError)
        return res.status(500).json({ error: 'Failed to find carousel' })
      }

      // Ensure video_order is unique within the carousel (1-5)
      const requestedOrder = video_order || 1
      if (requestedOrder < 1 || requestedOrder > 5) {
        return res.status(400).json({ error: 'video_order must be between 1 and 5' })
      }

      // Check if the order is already taken in this carousel
      const { data: existingVideo } = await supabaseAdmin
        .from('carousel_videos')
        .select('id')
        .eq('carousel_id', carousel.id)
        .eq('video_order', requestedOrder)
        .single()

      if (existingVideo) {
        return res.status(409).json({ 
          error: `Video order ${requestedOrder} is already taken in this carousel. Please choose a different order (1-5).` 
        })
      }

      // Add video to carousel with YouTube metadata
      const { data: video, error: videoError } = await supabaseAdmin
        .from('carousel_videos')
        .insert({
          carousel_id: carousel.id,
          youtube_url,
          video_title: customTitle?.trim() || youtubeData.title,
          video_description: customDescription?.trim() || youtubeData.description,
          video_order: requestedOrder
        })
        .select('*')
        .single()

      if (videoError) {
        console.error('Error adding video:', videoError)
        return res.status(500).json({ error: 'Failed to add video' })
      }

      return res.status(201).json({ 
        video,
        message: 'Healing video created successfully with YouTube metadata'
      })
    } catch (error) {
      console.error('Error in carousel-videos POST:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}