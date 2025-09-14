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
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Album ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('photo_albums')
        .select(`
          *,
          photos:album_photos(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Album not found' })
        return res.status(500).json({ error: 'Failed to fetch album' })
      }

      return res.status(200).json({ album: data as AlbumRow })
    } catch (error) {
      console.error('Album fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch album' })
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
      const { album_title, album_category, album_date, album_order, album_description, is_featured, cover_image_path, photos } = req.body

      // Validate album_order if provided (0-5 range)
      if (album_order !== undefined) {
        if (album_order < 0 || album_order > 5) {
          return res.status(400).json({ error: 'Album order must be between 0 and 5' })
        }

        // Check if the order is already taken by another album
        const { data: existingAlbum } = await supabaseAdmin
          .from('photo_albums')
          .select('id')
          .eq('album_order', album_order)
          .neq('id', id)
          .single()

        if (existingAlbum) {
          return res.status(409).json({
            error: `Album order ${album_order} is already taken. Please choose a different order (0-5).`
          })
        }
      }
      
      // Build update object with only provided fields
      const updateData: AlbumUpdate = {
        updated_at: new Date().toISOString()
      }

      if (album_title !== undefined) updateData.album_title = album_title
      if (album_description !== undefined) updateData.album_description = album_description
      if (album_date !== undefined) updateData.album_date = album_date
      if (cover_image_path !== undefined) updateData.cover_image_path = cover_image_path
      if (album_order !== undefined) updateData.album_order = album_order
      if (is_featured !== undefined) updateData.is_visible = is_featured
      
      // Update album
      const { data: album, error: albumError } = await supabaseAdmin
        .from('photo_albums')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (albumError) {
        console.error('Supabase album update error:', albumError)
        if (albumError.code === 'PGRST116') return res.status(404).json({ error: 'Album not found' })
        return res.status(500).json({ error: 'Failed to update album' })
      }

      // Handle photos if provided
      if (photos && Array.isArray(photos)) {
        // Delete existing photos
        await supabaseAdmin
          .from('album_photos')
          .delete()
          .eq('album_id', id)

        // Add new photos
        if (photos.length > 0) {
          const photoInserts: PhotoInsert[] = photos.map((photo: any, index: number) => ({
            album_id: id,
            image_path: photo.photo_url || photo.src,
            photo_caption: photo.caption || null,
            photo_order: photo.photo_order || index + 1
          }))

          const { error: photosError } = await supabaseAdmin
            .from('album_photos')
            .insert(photoInserts)

          if (photosError) {
            console.error('Photos update error:', photosError)
          }
        }
      }
      
      return res.status(200).json({ album: album as AlbumRow })
    } catch (error) {
      console.error('Album update error:', error)
      return res.status(500).json({ error: 'Failed to update album' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete photos first (foreign key constraint)
      await supabaseAdmin
        .from('album_photos')
        .delete()
        .eq('album_id', id)

      // Delete album
      const { error } = await supabaseAdmin
        .from('photo_albums')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase album delete error:', error)
        return res.status(500).json({ error: 'Failed to delete album' })
      }
      
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Album delete error:', error)
      return res.status(500).json({ error: 'Failed to delete album' })
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}