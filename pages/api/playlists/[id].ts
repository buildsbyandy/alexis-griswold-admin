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
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Playlist ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Playlist not found' })
        return res.status(500).json({ error: 'Failed to fetch playlist' })
      }

      return res.status(200).json({ playlist: data as PlaylistRow })
    } catch (error) {
      console.error('Playlist fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch playlist' })
    }
  }

  // All modification operations require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, theme_color, spotify_url, display_order, is_active } = req.body

      // Validate display_order if provided (1-3 unique limit)
      if (display_order !== undefined) {
        if (display_order < 1 || display_order > 3) {
          return res.status(400).json({ error: 'Display order must be between 1 and 3' })
        }

        // Check if the order is already taken by another playlist
        const { data: existingPlaylist } = await supabaseAdmin
          .from('spotify_playlists')
          .select('id')
          .eq('playlist_order', display_order)
          .neq('id', id)
          .single()

        if (existingPlaylist) {
          return res.status(409).json({
            error: `Display order ${display_order} is already taken. Please choose a different order (1-3).`
          })
        }
      }
      
      // Build update object with only provided fields
      const updateData: PlaylistUpdate = {
        updated_at: new Date().toISOString()
      }

      if (name !== undefined) updateData.playlist_title = name
      if (description !== undefined) updateData.description = description
      if (theme_color !== undefined) updateData.card_color = theme_color
      if (spotify_url !== undefined) updateData.spotify_url = spotify_url
      if (display_order !== undefined) updateData.playlist_order = display_order
      if (is_active !== undefined) updateData.is_active = is_active
      
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
      
      return res.status(200).json({ playlist: playlist as PlaylistRow })
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

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}