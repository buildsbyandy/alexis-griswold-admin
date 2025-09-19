import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Create a set of vlog IDs that have carousel items
    const vlogIdsWithItems = new Set(
      carouselItems?.map(item => item.ref_id).filter(Boolean) || []
    )

    // Find vlogs that don't have carousel items
    const vlogsWithoutItems = vlogs?.filter(vlog => !vlogIdsWithItems.has(vlog.id)) || []
    const vlogsWithItems = vlogs?.filter(vlog => vlogIdsWithItems.has(vlog.id)) || []

    // Group by carousel
    const mainChannelVlogs = vlogsWithItems.filter(v => v.carousel === 'main-channel' || !v.carousel)
    const agVlogsVlogs = vlogsWithItems.filter(v => v.carousel === 'ag-vlogs')

    return res.status(200).json({
      summary: {
        totalVlogs: vlogs?.length || 0,
        vlogsWithCarouselItems: vlogsWithItems.length,
        vlogsWithoutCarouselItems: vlogsWithoutItems.length,
        mainChannelVlogs: mainChannelVlogs.length,
        agVlogsVlogs: agVlogsVlogs.length
      },
      vlogsWithoutItems: vlogsWithoutItems.map(v => ({
        id: v.id,
        title: v.title,
        carousel: v.carousel,
        created_at: v.created_at
      })),
      vlogsWithItems: vlogsWithItems.map(v => ({
        id: v.id,
        title: v.title,
        carousel: v.carousel,
        created_at: v.created_at
      }))
    })

  } catch (error) {
    console.error('Error checking status:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
