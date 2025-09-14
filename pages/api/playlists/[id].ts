import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Playlist ID is required' })
  }

  // All operations require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const playlistData = req.body
      
      // Validate playlist_order if provided (1-3 unique limit)
      const requestedOrder = playlistData.order || playlistData.playlist_order
      if (requestedOrder !== undefined) {
        if (requestedOrder < 1 || requestedOrder > 3) {
          return res.status(400).json({ error: 'Playlist order must be between 1 and 3' })
        }

        // Check if the order is already taken by another playlist
        const { data: existingPlaylist } = await supabaseAdmin
          .from('spotify_playlists')
          .select('id')
          .eq('playlist_order', requestedOrder)
          .neq('id', id)
          .single()

        if (existingPlaylist) {
          return res.status(409).json({ 
            error: `Playlist order ${requestedOrder} is already taken. Please choose a different order (1-3).` 
          })
        }
      }
      
      // Remove undefined fields from the update
      const updateData = Object.fromEntries(
        Object.entries({
          playlist_title: playlistData.name || playlistData.playlist_title,
          playlist_body_text: playlistData.description || playlistData.playlist_body_text,
          mood_pill: playlistData.mood || playlistData.mood_pill,
          card_color: playlistData.color || playlistData.card_color,
          spotify_url: playlistData.spotifyUrl || playlistData.spotify_url,
          playlist_order: requestedOrder,
          isActive: playlistData.isActive,
          name: playlistData.name,
          description: playlistData.description,
          url: playlistData.url || playlistData.spotifyUrl,
          displayOrder: requestedOrder,
          previewColor: playlistData.previewColor || playlistData.color,
          stylizedTitle: playlistData.stylizedTitle,
          updated_at: new Date().toISOString()
        }).filter(([_, value]) => value !== undefined)
      )
      
      // Update playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('spotify_playlists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (playlistError) {
        console.error('Supabase playlist update error:', playlistError)
        return res.status(500).json({ error: 'Failed to update playlist' })
      }
      
      return res.status(200).json({ playlist })
    } catch (error) {
      console.error('Playlist update error:', error)
      return res.status(500).json({ error: 'Failed to update playlist' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete playlist
      const { error } = await supabaseAdmin
        .from('spotify_playlists')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase playlist delete error:', error)
        return res.status(500).json({ error: 'Failed to delete playlist' })
      }
      
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Playlist delete error:', error)
      return res.status(500).json({ error: 'Failed to delete playlist' })
    }
  }

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}