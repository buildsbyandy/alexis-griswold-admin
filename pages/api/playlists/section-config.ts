import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

interface SpotifySectionConfig {
  section_title: string;
  section_subtitle: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get the section configuration from the first playlist record
      // We'll use a special record with id '00000000-0000-0000-0000-000000000001' for section config
      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .select('section_title, section_subtitle')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Spotify section config:', error)
        return res.status(500).json({ error: 'Failed to fetch section configuration' })
      }
      
      // If no config exists, return default values
      if (!data) {
        return res.status(200).json({
          config: {
            section_title: 'Listen to My Playlists',
            section_subtitle: 'Curated music for every mood and moment'
          }
        })
      }
      
      return res.status(200).json({ 
        config: {
          section_title: data.section_title || 'Listen to My Playlists',
          section_subtitle: data.section_subtitle || 'Curated music for every mood and moment'
        }
      })
    } catch (error) {
      console.error('Error in Spotify section config API:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    try {
      const config = req.body as SpotifySectionConfig
      console.log('Saving Spotify section config:', config)
      
      // Upsert the section configuration using a special record
      const upsertData = {
        id: '00000000-0000-0000-0000-000000000001',
        section_title: config.section_title || 'Listen to My Playlists',
        section_subtitle: config.section_subtitle || 'Curated music for every mood and moment',
        playlist_title: 'SECTION_CONFIG', // Placeholder
        spotify_url: 'https://placeholder.com', // Placeholder
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .upsert(upsertData)
        .select('section_title, section_subtitle')
        .single()
      
      if (error) {
        console.error('Supabase upsert error:', error)
        return res.status(500).json({ error: 'Failed to update section configuration', details: error })
      }

      return res.status(200).json({ 
        config: {
          section_title: data.section_title,
          section_subtitle: data.section_subtitle
        }
      })
    } catch (error) {
      console.error('Error saving Spotify section config:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,PUT')
  return res.status(405).json({ error: 'Method Not Allowed' })
}
