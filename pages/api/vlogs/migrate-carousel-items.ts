import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { findCarouselByPageSlug, createCarousel, createCarouselItem } from '../../../lib/services/carouselService'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get all vlogs
    const { data: vlogs, error: vlogsError } = await supabaseAdmin
      .from('vlogs')
      .select('*')
      .order('created_at', { ascending: false })

    if (vlogsError) {
      console.error('Error fetching vlogs:', vlogsError)
      return res.status(500).json({ error: 'Failed to fetch vlogs' })
    }

    // Get all existing carousel items for vlogs
    const { data: carouselItems, error: itemsError } = await supabaseAdmin
      .from('carousel_items')
      .select(`
        *,
        carousels!inner(page, slug)
      `)
      .eq('carousels.page', 'vlogs')

    if (itemsError) {
      console.error('Error fetching carousel items:', itemsError)
      return res.status(500).json({ error: 'Failed to fetch carousel items' })
    }

    // Create a set of vlog IDs that already have carousel items
    const vlogIdsWithItems = new Set(
      carouselItems?.map(item => item.ref_id).filter(Boolean) || []
    )

    // Find vlogs that don't have carousel items
    const vlogsWithoutItems = vlogs?.filter(vlog => !vlogIdsWithItems.has(vlog.id)) || []

    console.log(`Found ${vlogsWithoutItems.length} vlogs without carousel items`)

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[]
    }

    // Process each vlog without carousel items
    for (const vlog of vlogsWithoutItems) {
      try {
        results.processed++

        // Determine carousel slug based on vlog's carousel field or default to 'main-channel'
        const carouselSlug = vlog.carousel === 'ag-vlogs' ? 'ag-vlogs' : 'main-channel'

        // Ensure carousel exists
        let carousel = await findCarouselByPageSlug('vlogs', carouselSlug)
        if (carousel.error) {
          results.errors.push(`Failed to find carousel for vlog ${vlog.id}: ${carousel.error}`)
          continue
        }

        if (!carousel.data) {
          const created = await createCarousel({ 
            page: 'vlogs', 
            slug: carouselSlug, 
            is_active: true 
          })
          if (created.error) {
            results.errors.push(`Failed to create carousel for vlog ${vlog.id}: ${created.error}`)
            continue
          }
          carousel = { data: created.data }
        }

        // Create carousel item
        const orderIndex = vlog.display_order || 0
        const caption = vlog.title || null
        
        const itemResult = await createCarouselItem({
          carousel_id: carousel.data!.id,
          kind: 'video',
          order_index: orderIndex,
          ref_id: vlog.id,
          caption,
          is_active: true,
        })

        if (itemResult.error) {
          results.errors.push(`Failed to create carousel item for vlog ${vlog.id}: ${itemResult.error}`)
          continue
        }

        results.created++
        console.log(`Created carousel item for vlog: ${vlog.title} (${vlog.id})`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Error processing vlog ${vlog.id}: ${errorMsg}`)
        console.error(`Error processing vlog ${vlog.id}:`, error)
      }
    }

    return res.status(200).json({
      message: 'Migration completed',
      results: {
        totalVlogs: vlogs?.length || 0,
        vlogsWithoutItems: vlogsWithoutItems.length,
        processed: results.processed,
        created: results.created,
        errors: results.errors
      }
    })

  } catch (error) {
    console.error('Error in migration:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
