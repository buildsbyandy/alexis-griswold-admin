import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { youtubeService } from '../../../lib/services/youtubeService'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get all vlogs that are missing youtube_id
    const { data: vlogs, error: vlogsError } = await supabaseAdmin
      .from('vlogs')
      .select('*')
      .or('youtube_id.is.null,youtube_id.eq.')
      .not('youtube_url', 'is', null)

    if (vlogsError) {
      console.error('Error fetching vlogs:', vlogsError)
      return res.status(500).json({ error: 'Failed to fetch vlogs' })
    }

    console.log(`Found ${vlogs?.length || 0} vlogs missing youtube_id`)

    const results = {
      processed: 0,
      updated: 0,
      errors: [] as string[]
    }

    // Process each vlog
    for (const vlog of vlogs || []) {
      try {
        results.processed++

        if (!vlog.youtube_url) {
          results.errors.push(`Vlog ${vlog.id} has no YouTube URL`)
          continue
        }

        // Extract YouTube ID from URL
        const videoIdResult = youtubeService.extract_video_id(vlog.youtube_url)
        if (videoIdResult.error || !videoIdResult.data) {
          results.errors.push(`Vlog ${vlog.id}: ${videoIdResult.error}`)
          continue
        }

        const youtubeId = videoIdResult.data

        // Update the vlog with the YouTube ID
        const { error: updateError } = await supabaseAdmin
          .from('vlogs')
          .update({ youtube_id: youtubeId })
          .eq('id', vlog.id)

        if (updateError) {
          results.errors.push(`Vlog ${vlog.id}: Failed to update - ${updateError.message}`)
          continue
        }

        results.updated++
        console.log(`Updated vlog ${vlog.id} with YouTube ID: ${youtubeId}`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Vlog ${vlog.id}: ${errorMsg}`)
        console.error(`Error processing vlog ${vlog.id}:`, error)
      }
    }

    return res.status(200).json({
      message: 'YouTube ID migration completed',
      results: {
        totalVlogs: vlogs?.length || 0,
        processed: results.processed,
        updated: results.updated,
        errors: results.errors
      }
    })

  } catch (error) {
    console.error('Error in YouTube ID migration:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
