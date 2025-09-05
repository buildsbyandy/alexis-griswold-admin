import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // All methods require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    // Add video to healing carousel
    try {
      const { page_type, carousel_number, youtube_url, video_title, video_description, video_order } = req.body

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

      // Add video to carousel
      const { data: video, error: videoError } = await supabaseAdmin
        .from('carousel_videos')
        .insert({
          carousel_id: carousel.id,
          youtube_url,
          video_title,
          video_description,
          video_order: video_order || 1
        })
        .select('*')
        .single()

      if (videoError) {
        console.error('Error adding video:', videoError)
        return res.status(500).json({ error: 'Failed to add video' })
      }

      return res.status(201).json({ video })
    } catch (error) {
      console.error('Error in carousel-videos POST:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}