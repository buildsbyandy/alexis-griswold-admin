import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get healing carousels with their videos
    try {
      // First get the carousels
      const { data: carousels, error: carouselsError } = await supabaseAdmin
        .from('video_carousels')
        .select('*')
        .eq('page_type', 'healing')
        .order('carousel_number', { ascending: true })

      if (carouselsError) {
        console.error('Error fetching carousels:', carouselsError)
        return res.status(500).json({ error: 'Failed to fetch carousels' })
      }

      // Then get videos for each carousel
      const carouselsWithVideos = await Promise.all(
        (carousels || []).map(async (carousel) => {
          const { data: videos, error: videosError } = await supabaseAdmin
            .from('carousel_videos')
            .select('*')
            .eq('carousel_id', carousel.id)
            .order('video_order', { ascending: true })

          if (videosError) {
            console.error('Error fetching videos for carousel:', videosError)
            return { ...carousel, videos: [] }
          }

          return {
            ...carousel,
            videos: videos || []
          }
        })
      )

      return res.status(200).json({ carousels: carouselsWithVideos })
    } catch (error) {
      console.error('Error in healing carousels API:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    // Create new carousel (admin only)
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { carousel_number, header, subtitle } = req.body

      const { data, error } = await supabaseAdmin
        .from('video_carousels')
        .insert({
          page_type: 'healing',
          carousel_number,
          header,
          subtitle
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating carousel:', error)
        return res.status(500).json({ error: 'Failed to create carousel' })
      }

      return res.status(201).json({ carousel: data })
    } catch (error) {
      console.error('Error in healing carousels POST:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}