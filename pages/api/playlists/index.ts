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
      // Note: This endpoint is now primarily used for fetching all playlists metadata
      // Ordering is handled by the carousel system in the service layer
      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .select('*')
        .order('created_at', { ascending: true })

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
      const { playlist_title, description, card_color, thumbnail_path, use_color_overlay, spotify_url, is_active } = req.body

      // Validate required fields
      if (!playlist_title) {
        return res.status(400).json({ error: 'Playlist name is required' })
      }
      if (!spotify_url) {
        return res.status(400).json({ error: 'Spotify URL is required' })
      }

      // Create the playlist (ordering is now handled by carousel system)
      const playlistInsert: PlaylistInsert = {
        playlist_title,
        description: description || null,
        card_color: card_color || null,
        thumbnail_path: thumbnail_path || null,
        use_color_overlay: use_color_overlay || false,
        spotify_url: spotify_url,
        // playlist_order field removed - no longer used for ordering
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