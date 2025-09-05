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
      
      return res.status(200).json({ albums: data })
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
      const { photos, ...albumData } = req.body
      
      // Create the album first
      const { data: album, error: albumError } = await supabaseAdmin
        .from('photo_albums')
        .insert({
          album_title: albumData.title,
          album_subtitle: albumData.subtitle || '',
          album_description: albumData.description || '',
          album_date: albumData.date,
          cover_image_path: albumData.coverImage,
          category: albumData.category,
          is_featured: albumData.isFeatured || false,
          sort_order: albumData.order || 0,
          is_published: true
        })
        .select()
        .single()
      
      if (albumError) {
        console.error('Album creation error:', albumError)
        return res.status(500).json({ error: 'Failed to create album' })
      }

      // Add photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        const photoInserts = photos.map((photo: any, index: number) => ({
          album_id: album.id,
          image_path: photo.src,
          photo_caption: photo.caption || '',
          sort_order: photo.order || index + 1
        }))

        const { error: photosError } = await supabaseAdmin
          .from('album_photos')
          .insert(photoInserts)

        if (photosError) {
          console.error('Photos creation error:', photosError)
          // Don't fail the entire request if photos fail, just log it
        }
      }
      
      return res.status(201).json({ album })
    } catch (error) {
      console.error('Album creation error:', error)
      return res.status(500).json({ error: 'Failed to create album' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}