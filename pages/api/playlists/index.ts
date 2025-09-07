import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

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
      
      return res.status(200).json({ playlists: data })
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
      const playlistData = req.body
      
      // Validate playlist_order (1-3 unique limit)
      const requestedOrder = playlistData.order || playlistData.playlist_order || 0
      if (requestedOrder < 1 || requestedOrder > 3) {
        return res.status(400).json({ error: 'Playlist order must be between 1 and 3' })
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
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('spotify_playlists')
        .insert({
          playlist_title: playlistData.name || playlistData.playlist_title,
          playlist_body_text: playlistData.description || playlistData.playlist_body_text,
          mood_pill: playlistData.mood || playlistData.mood_pill,
          card_color: playlistData.color || playlistData.card_color,
          spotify_url: playlistData.spotifyUrl || playlistData.spotify_url,
          playlist_order: requestedOrder,
          isActive: playlistData.isActive !== undefined ? playlistData.isActive : true,
          name: playlistData.name,
          description: playlistData.description,
          url: playlistData.url || playlistData.spotifyUrl,
          displayOrder: requestedOrder,
          previewColor: playlistData.previewColor || playlistData.color,
          stylizedTitle: playlistData.stylizedTitle
        })
        .select()
        .single()
      
      if (playlistError) {
        console.error('Playlist creation error:', playlistError)
        return res.status(500).json({ error: 'Failed to create playlist' })
      }
      
      return res.status(201).json({ playlist })
    } catch (error) {
      console.error('Playlist creation error:', error)
      return res.status(500).json({ error: 'Failed to create playlist' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}