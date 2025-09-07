import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

interface HomeContent {
  background_video_path: string;
  fallback_image_path: string;
  video_title: string;
  video_description: string;
  videoOpacity?: number;
  // Frontend compatibility fields
  videoBackground?: string;
  fallbackImage?: string;
  videoTitle?: string;
  videoDescription?: string;
}

interface VideoHistoryItem {
  path: string;
  uploaded_at: string;
  title: string;
  size?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // First try to get the specific home content record
    const { data: specificData, error: specificError } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
    
    if (specificData) {
      return res.status(200).json({ content: specificData })
    }
    
    // If specific record doesn't exist, get the first published record
    const { data: publishedData, error: publishedError } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (publishedData) {
      return res.status(200).json({ content: publishedData })
    }
    
    // If no published record exists, get any record
    const { data: anyData, error: anyError } = await supabaseAdmin
      .from('home_content')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (anyData) {
      return res.status(200).json({ content: anyData })
    }
    
    // Return safe defaults if no data exists
    const defaultContent = {
      background_video_path: '',
      fallback_image_path: '',
      video_title: 'Welcome to Alexis Griswold',
      video_description: 'Experience wellness, recipes, and lifestyle content',
      video_history: []
    }
    
    return res.status(200).json({ content: defaultContent })
  }

  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const content = req.body as HomeContent
    console.log('PUT /api/home received content:', content)
    
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
    const newVideoPath = content.background_video_path || content.videoBackground;
    if (currentData?.background_video_path && currentData.background_video_path !== newVideoPath) {
      const historyItem: VideoHistoryItem = {
        path: currentData.background_video_path,
        uploaded_at: new Date().toISOString(),
        title: currentData.video_title || 'Previous Video'
      }
      
      // Add to front, keep max 3
      videoHistory.unshift(historyItem)
      videoHistory = videoHistory.slice(0, 3)
    }
    
    // First, unpublish all existing records
    await supabaseAdmin
      .from('home_content')
      .update({ is_published: false })
      .neq('id', '00000000-0000-0000-0000-000000000001')
    
    // Upsert the home content with updated history
    const upsertData = {
      id: '00000000-0000-0000-0000-000000000001',
      background_video_path: content.background_video_path || content.videoBackground,
      fallback_image_path: content.fallback_image_path || content.fallbackImage,
      video_title: content.video_title || content.videoTitle,
      video_description: content.video_description || content.videoDescription,
      video_history: videoHistory,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    
    console.log('Upserting data to home_content:', upsertData);
    
    const { data, error } = await supabaseAdmin
      .from('home_content')
      .upsert(upsertData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Failed to update home content', details: error });
    }
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