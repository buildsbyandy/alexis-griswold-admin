import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

interface HomeContent {
  background_video_path: string;
  fallback_image_path: string;
  hero_main_title: string;
  hero_subtitle: string;
  video_title: string;
  video_description: string;
  videoOpacity?: number;
  // Frontend compatibility fields
  videoBackground?: string;
  fallbackImage?: string;
  videoTitle?: string;
  videoDescription?: string;
  heroMainTitle?: string;
  heroSubtitle?: string;
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
      hero_main_title: 'Welcome to Alexis Griswold',
      hero_subtitle: 'Experience wellness, recipes, and lifestyle content',
      video_title: 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
      video_description: 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.',
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
      hero_main_title: content.hero_main_title || content.heroMainTitle || 'Welcome to Alexis Griswold',
      hero_subtitle: content.hero_subtitle || content.heroSubtitle || 'Experience wellness, recipes, and lifestyle content',
      video_title: content.video_title || content.videoTitle || 'Welcome to Alexis Griswold - Wellness and Lifestyle Content',
      video_description: content.video_description || content.videoDescription || 'Experience wellness, recipes, and lifestyle content with Alexis Griswold. Discover healthy recipes, healing practices, and lifestyle tips.',
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
    
    console.log('Delete request for video path:', videoPath);
    
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
    try {
      // Extract the file path from the full URL
      // Video URLs look like: https://oycmdmrnschixthatslb.supabase.co/storage/v1/object/public/media/videos/1757204630212-rat8oyrm9.mp4
      const url = new URL(videoPath);
      const pathParts = url.pathname.split('/');
      const bucket = pathParts[3]; // 'media'
      const filePath = pathParts.slice(4).join('/'); // 'videos/1757204630212-rat8oyrm9.mp4'
      
      console.log('Deleting file from storage:', { bucket, filePath });
      
      const { data, error: storageError } = await supabaseAdmin.storage
        .from(bucket)
        .remove([filePath]);
      
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Don't fail the entire operation if storage deletion fails
        // The file might already be deleted or the path might be incorrect
      } else {
        console.log('Successfully deleted file from storage:', filePath);
      }
    } catch (error) {
      console.error('Error parsing video URL for deletion:', error);
      // Don't fail the entire operation if URL parsing fails
    }
    
    // Update database
    const { error } = await supabaseAdmin
      .from('home_content')
      .update({ 
        video_history: videoHistory,
        updated_at: new Date().toISOString() 
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
    
    if (error) {
      console.error('Database update error:', error);
      return res.status(500).json({ error: 'Failed to update video history' });
    }
    
    console.log('Successfully deleted video from history and storage');
    return res.status(200).json({ message: 'Video deleted successfully from both history and storage' });
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}