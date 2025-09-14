import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Album ID is required' })
  }

  // All operations require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const { photos, ...albumData } = req.body
      
      // Validate album_order if provided (0-5 range)
      if (albumData.order !== undefined) {
        const requestedOrder = albumData.order
        if (requestedOrder < 0 || requestedOrder > 5) {
          return res.status(400).json({ error: 'Album order must be between 0 and 5' })
        }

        // Check if the order is already taken by another album
        const { data: existingAlbum } = await supabaseAdmin
          .from('photo_albums')
          .select('id')
          .eq('album_order', requestedOrder)
          .neq('id', id)
          .single()

        if (existingAlbum) {
          return res.status(409).json({ 
            error: `Album order ${requestedOrder} is already taken. Please choose a different order (0-5).` 
          })
        }
      }
      
      // Remove undefined fields from the update
      const updateData = Object.fromEntries(
        Object.entries({
          album_title: albumData.title,
          album_subtitle: albumData.subtitle,
          album_description: albumData.description,
          album_date: albumData.date,
          cover_image_path: albumData.coverImage,
          album_order: albumData.order,
          updated_at: new Date().toISOString()
        }).filter(([_, value]) => value !== undefined)
      )
      
      // Update album
      const { data: album, error: albumError } = await supabaseAdmin
        .from('photo_albums')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (albumError) {
        console.error('Supabase album update error:', albumError)
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
          const photoInserts = photos.map((photo: any, index: number) => ({
            album_id: id,
            image_path: photo.src,
            photo_caption: photo.caption || '',
            photo_order: photo.order || index + 1
          }))

          const { error: photosError } = await supabaseAdmin
            .from('album_photos')
            .insert(photoInserts)

          if (photosError) {
            console.error('Photos update error:', photosError)
          }
        }
      }
      
      return res.status(200).json({ album })
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

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}