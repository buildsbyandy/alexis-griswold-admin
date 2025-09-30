import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { vlogService } from '@/lib/services/vlogService'
import type { Database } from '@/types/supabase.generated'

type PageType = Database['public']['Enums']['page_type']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const featuredVlog = await vlogService.getFeaturedVlog()
      res.status(200).json({ data: featuredVlog })
    } catch (error) {
      console.error('Error fetching featured vlog:', error)
      res.status(500).json({ error: 'Failed to fetch featured vlog' })
    }
  } else if (req.method === 'PUT') {
    // Authentication check
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { vlogId } = req.body

      if (!vlogId) {
        return res.status(400).json({ error: 'vlogId is required' })
      }

      console.log(`[DEBUG] Setting featured vlog: ${vlogId}`)

      // Step 1: Find or create the 'vlogs-featured' carousel
      let { data: carousel, error: carouselError } = await supabaseAdmin
        .from('carousels')
        .select('*')
        .eq('page', 'vlogs' as PageType)
        .eq('slug', 'vlogs-featured')
        .single()

      if (carouselError && carouselError.code === 'PGRST116') {
        // Carousel doesn't exist, create it
        console.log(`[DEBUG] Creating vlogs-featured carousel`)
        const { data: newCarousel, error: createError } = await supabaseAdmin
          .from('carousels')
          .insert({
            page: 'vlogs' as PageType,
            slug: 'vlogs-featured',
            is_active: true
          })
          .select('*')
          .single()

        if (createError) {
          console.error('Error creating carousel:', createError)
          return res.status(500).json({ error: 'Failed to create featured carousel' })
        }
        carousel = newCarousel
      } else if (carouselError) {
        console.error('Error finding carousel:', carouselError)
        return res.status(500).json({ error: 'Failed to find featured carousel' })
      }

      // Step 2: Delete all existing items from the featured carousel
      console.log(`[DEBUG] Clearing existing featured items`)
      const { error: deleteError } = await supabaseAdmin
        .from('carousel_items')
        .delete()
        .eq('carousel_id', carousel!.id)

      if (deleteError) {
        console.error('Error deleting existing items:', deleteError)
        return res.status(500).json({ error: 'Failed to clear existing featured items' })
      }

      // Step 3: Get the vlog data to create a proper carousel item
      const { data: vlog, error: vlogError } = await supabaseAdmin
        .from('vlogs')
        .select('*')
        .eq('id', vlogId)
        .single()

      if (vlogError) {
        console.error('Error fetching vlog:', vlogError)
        return res.status(500).json({ error: 'Vlog not found' })
      }

      // Step 4: Create the new featured carousel item
      console.log(`[DEBUG] Creating new featured carousel item`)
      const { data: carouselItem, error: itemError } = await supabaseAdmin
        .from('carousel_items')
        .insert({
          carousel_id: carousel!.id,
          kind: 'video',
          youtube_id: vlog.youtube_id,
          caption: vlog.title,
          order_index: 0,
          is_active: true
        })
        .select('*')
        .single()

      if (itemError) {
        console.error('Error creating carousel item:', itemError)
        return res.status(500).json({ error: 'Failed to create featured item' })
      }

      console.log(`[DEBUG] Successfully set featured vlog: ${vlogId}`)
      res.status(200).json({ message: 'Featured vlog updated successfully' })

    } catch (error) {
      console.error('Error setting featured vlog:', error)
      res.status(500).json({ error: 'Failed to set featured vlog' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}