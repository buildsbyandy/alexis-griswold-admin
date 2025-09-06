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
  videoOpacity?: number;
}

interface VideoHistoryItem {
  path: string;
  uploaded_at: string;
  title: string;
  size?: number;
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
    
    // Get current data to manage video history
    const { data: currentData } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    // Manage video history (max 3 items)
    let videoHistory: VideoHistoryItem[] = []
    if (currentData?.video_history) {
      videoHistory = Array.isArray(currentData.video_history) 
        ? currentData.video_history 
        : JSON.parse(currentData.video_history)
    }
    
    // Add current video to history if it's different from new video
    if (currentData?.background_video_path && currentData.background_video_path !== content.videoBackground) {
      const historyItem: VideoHistoryItem = {
        path: currentData.background_video_path,
        uploaded_at: new Date().toISOString(),
        title: currentData.video_title || 'Previous Video'
      }
      
      // Add to front, keep max 3
      videoHistory.unshift(historyItem)
      videoHistory = videoHistory.slice(0, 3)
    }
    
    // Upsert the home content with updated history
    const { data, error } = await supabaseAdmin
      .from('home_content')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        background_video_path: content.videoBackground,
        fallback_image_path: content.fallbackImage,
        hero_main_title: content.videoTitle,
        hero_subtitle: content.videoDescription,
        video_title: content.videoTitle,
        video_description: content.videoDescription,
        video_history: videoHistory,
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to update home content' })
    return res.status(200).json({ content: data })
  }

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const { videoPath } = req.body
    if (!videoPath) return res.status(400).json({ error: 'Video path required' })
    
    // Get current data
    const { data: currentData } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    if (!currentData) return res.status(404).json({ error: 'Home content not found' })
    
    // Remove from video history
    let videoHistory: VideoHistoryItem[] = []
    if (currentData.video_history) {
      videoHistory = Array.isArray(currentData.video_history) 
        ? currentData.video_history 
        : JSON.parse(currentData.video_history)
      
      videoHistory = videoHistory.filter(item => item.path !== videoPath)
    }
    
    // Delete from Supabase Storage
    const filePath = videoPath.replace(/^\//, '') // Remove leading slash
    await supabaseAdmin.storage.from('media').remove([filePath])
    
    // Update database
    const { error } = await supabaseAdmin
      .from('home_content')
      .update({ 
        video_history: videoHistory,
        updated_at: new Date().toISOString() 
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
    
    if (error) return res.status(500).json({ error: 'Failed to update video history' })
    return res.status(200).json({ message: 'Video deleted successfully' })
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}