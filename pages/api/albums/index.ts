import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type AlbumRow = Database['public']['Tables']['photo_albums']['Row']
type AlbumInsert = Database['public']['Tables']['photo_albums']['Insert']
type AlbumUpdate = Database['public']['Tables']['photo_albums']['Update']
type PhotoInsert = Database['public']['Tables']['album_photos']['Insert']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('photo_albums')
        .select(`
          *,
          photos:album_photos(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch albums' })
      }
      
      return res.status(200).json({ albums: data as AlbumRow[] })
    } catch (error) {
      console.error('Albums fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch albums' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    try {
      const { album_title, album_category, album_date, album_order, album_description, is_featured, cover_image_path, photos } = req.body

      // Validate required fields
      if (!album_title?.trim()) {
        return res.status(400).json({ error: 'Album title is required' })
      }
      if (!cover_image_path?.trim()) {
        return res.status(400).json({ error: 'Cover image is required' })
      }
      if (!album_date) {
        return res.status(400).json({ error: 'Album date is required' })
      }

      // Validate album_order (0-5 range)
      const requestedOrder = album_order || 0
      if (requestedOrder < 0 || requestedOrder > 5) {
        return res.status(400).json({ error: 'Album order must be between 0 and 5' })
      }

      // Check if the order is already taken
      const { data: existingAlbum } = await supabaseAdmin
        .from('photo_albums')
        .select('id')
        .eq('album_order', requestedOrder)
        .single()

      if (existingAlbum) {
        return res.status(409).json({ 
          error: `Album order ${requestedOrder} is already taken. Please choose a different order (0-5).` 
        })
      }

      // Create the album first
      const albumInsert: AlbumInsert = {
        album_title: album_title,
        album_description: album_description || null,
        album_date: album_date,
        cover_image_path: cover_image_path,
        album_order: requestedOrder,
        is_visible: is_featured || false
      }

      const { data: album, error: albumError } = await supabaseAdmin
        .from('photo_albums')
        .insert(albumInsert)
        .select()
        .single()
      
      if (albumError) {
        console.error('Album creation error:', albumError)
        return res.status(500).json({ error: 'Failed to create album' })
      }

      // Add photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        const photoInserts: PhotoInsert[] = photos.map((photo: any, index: number) => ({
          album_id: album.id,
          image_path: photo.photo_url || photo.src,
          photo_caption: photo.caption || null,
          photo_order: photo.photo_order || index + 1
        }))

        const { error: photosError } = await supabaseAdmin
          .from('album_photos')
          .insert(photoInserts)

        if (photosError) {
          console.error('Photos creation error:', photosError)
          // Don't fail the entire request if photos fail, just log it
        }
      }
      
      return res.status(201).json({ album: album as AlbumRow })
    } catch (error) {
      console.error('Album creation error:', error)
      return res.status(500).json({ error: 'Failed to create album' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}