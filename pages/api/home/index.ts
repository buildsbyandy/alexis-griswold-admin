import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

interface HomeContent {
  videoBackground: string;
  fallbackImage: string;
  videoTitle: string;
  videoDescription: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch home content' })
    }
    
    // Return default content if no data exists
    const defaultContent = {
      videoBackground: '/alexisHome.mp4',
      fallbackImage: '/public/images/home-fallback.jpg',
      videoTitle: 'Welcome to Alexis Griswold',
      videoDescription: 'Experience wellness, recipes, and lifestyle content'
    }
    
    return res.status(200).json({ content: data || defaultContent })
  }

  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const content = req.body as HomeContent
    
    // Upsert the home content
    const { data, error } = await supabaseAdmin
      .from('home_content')
      .upsert({
        id: 1, // Single row for home content
        video_background: content.videoBackground,
        fallback_image: content.fallbackImage,
        video_title: content.videoTitle,
        video_description: content.videoDescription,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to update home content' })
    return res.status(200).json({ content: data })
  }

  res.setHeader('Allow', 'GET,PUT')
  return res.status(405).json({ error: 'Method Not Allowed' })
}