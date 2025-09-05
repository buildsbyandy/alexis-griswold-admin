import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // All methods require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Video ID is required' })
  }

  if (req.method === 'PUT') {
    // Update carousel video
    try {
      const updateData: any = {}
      
      if (req.body.youtube_url !== undefined) {
        updateData.youtube_url = req.body.youtube_url
      }
      if (req.body.video_title !== undefined) {
        updateData.video_title = req.body.video_title
      }
      if (req.body.video_description !== undefined) {
        updateData.video_description = req.body.video_description
      }
      if (req.body.video_order !== undefined) {
        updateData.video_order = req.body.video_order
      }

      // Handle carousel changes (move to different carousel)
      if (req.body.carousel_number !== undefined) {
        // Find the target carousel
        const { data: targetCarousel, error: carouselError } = await supabaseAdmin
          .from('video_carousels')
          .select('*')
          .eq('page_type', 'healing')
          .eq('carousel_number', req.body.carousel_number)
          .single()

        if (carouselError) {
          console.error('Error finding target carousel:', carouselError)
          return res.status(500).json({ error: 'Failed to find target carousel' })
        }

        updateData.carousel_id = targetCarousel.id
      }

      const { data, error } = await supabaseAdmin
        .from('carousel_videos')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating video:', error)
        return res.status(500).json({ error: 'Failed to update video' })
      }

      return res.status(200).json({ video: data })
    } catch (error) {
      console.error('Error in carousel-videos PUT:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    // Delete carousel video
    try {
      const { error } = await supabaseAdmin
        .from('carousel_videos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting video:', error)
        return res.status(500).json({ error: 'Failed to delete video' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error in carousel-videos DELETE:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}