import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type PlaylistRow = Database['public']['Tables']['spotify_playlists']['Row']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { ids } = req.query

      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ error: 'IDs parameter is required' })
      }

      const playlistIds = ids.split(',').filter(Boolean)
      if (playlistIds.length === 0) {
        return res.status(200).json({ playlists: [] })
      }

      const { data, error } = await supabaseAdmin
        .from('spotify_playlists')
        .select('*')
        .in('id', playlistIds)

      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch playlist metadata' })
      }

      return res.status(200).json({ playlists: data as PlaylistRow[] })
    } catch (error) {
      console.error('Playlist metadata fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch playlist metadata' })
    }
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method Not Allowed' })
}