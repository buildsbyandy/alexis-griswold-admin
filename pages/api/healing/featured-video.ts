import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('healing_page_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to fetch healing featured video' })
    return res.status(200).json({ video: data })
  }

  if (req.method === 'PUT') {
    // Map from modal interface to database fields
    const videoData = {
      hero_video_youtube_url: req.body.videoUrl,
      hero_video_title: req.body.title,
      hero_video_subtitle: req.body.description,
      hero_video_date: req.body.publishedAt,
      updated_at: new Date().toISOString()
    }

    // Get existing record or create new one
    const { data: existing } = await supabaseAdmin
      .from('healing_page_content')
      .select('id')
      .limit(1)
      .single()

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('healing_page_content')
        .update(videoData)
        .eq('id', existing.id)
        .select('*')
        .single()
      
      if (error) return res.status(500).json({ error: 'Failed to update featured video' })
      result = data
    } else {
      // Create new record
      const { data, error } = await supabaseAdmin
        .from('healing_page_content')
        .insert(videoData)
        .select('*')
        .single()
      
      if (error) return res.status(500).json({ error: 'Failed to create featured video' })
      result = data
    }
    
    return res.status(200).json({ video: result })
  }

  res.setHeader('Allow', 'GET,PUT')
  return res.status(405).json({ error: 'Method Not Allowed' })
}