import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type PlaylistRow = Database['public']['Tables']['spotify_playlists']['Row']
type PlaylistInsert = Database['public']['Tables']['spotify_playlists']['Insert']
type PlaylistUpdate = Database['public']['Tables']['spotify_playlists']['Update']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .select('*')
        .order('playlist_order', { ascending: true })

      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch playlists' })
      }

      return res.status(200).json({ playlists: data as PlaylistRow[] })
    } catch (error) {
      console.error('Playlists fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch playlists' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    try {
      const { name, description, theme_color, spotify_url, display_order, is_active } = req.body

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Playlist name is required' })
      }
      if (!spotify_url) {
        return res.status(400).json({ error: 'Spotify URL is required' })
      }

      // Validate display_order (1-3 unique limit)
      const requestedOrder = display_order || 0
      if (requestedOrder < 1 || requestedOrder > 3) {
        return res.status(400).json({ error: 'Display order must be between 1 and 3' })
      }

      // Check if the order is already taken
      const { data: existingPlaylist } = await supabaseAdmin
        .from('spotify_playlists')
        .select('id')
        .eq('playlist_order', requestedOrder)
        .single()

      if (existingPlaylist) {
        return res.status(409).json({ 
          error: `Playlist order ${requestedOrder} is already taken. Please choose a different order (1-3).` 
        })
      }

      // Create the playlist
      const playlistInsert: PlaylistInsert = {
        playlist_title: name,
        description: description || null,
        card_color: theme_color || null,
        spotify_url: spotify_url,
        playlist_order: requestedOrder,
        is_active: is_active !== undefined ? is_active : true
      }

      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('spotify_playlists')
        .insert(playlistInsert)
        .select()
        .single()
      
      if (playlistError) {
        console.error('Playlist creation error:', playlistError)
        return res.status(500).json({ error: 'Failed to create playlist' })
      }
      
      return res.status(201).json({ playlist: playlist as PlaylistRow })
    } catch (error) {
      console.error('Playlist creation error:', error)
      return res.status(500).json({ error: 'Failed to create playlist' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}