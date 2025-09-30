import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'
import { findCarouselByPageSlugDB } from '@/lib/db/carousels'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type PageType = Database['public']['Enums']['page_type']

export const config = { runtime: 'nodejs' }

/**
 * API endpoint for finding carousels by page and slug.
 *
 * This endpoint uses direct Supabase calls (server-only) and is called by
 * the carouselService.ts functions which handle the client/server URL logic.
 *
 * This pattern allows:
 * - Client components to call carouselService functions
 * - Server-side code to call carouselService functions (for local development)
 * - Both paths eventually hit this API endpoint with direct DB access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page, slug } = req.query

      console.log(`[DEBUG] /api/carousels/find called with query:`, req.query);

      if (!page || typeof page !== 'string') {
        console.log(`[DEBUG] Invalid page parameter:`, page);
        return res.status(400).json({ error: 'Page parameter is required' })
      }

      if (!slug || typeof slug !== 'string') {
        console.log(`[DEBUG] Invalid slug parameter:`, slug);
        return res.status(400).json({ error: 'Slug parameter is required' })
      }

      // Use the database function instead of direct Supabase calls
      const result = await findCarouselByPageSlugDB(page as PageType, slug);

      if (result.error) {
        console.log(`[DEBUG] Database function returned error:`, result.error);
        return res.status(500).json({ error: result.error })
      }

      console.log(`[DEBUG] Database function returned data:`, result.data);
      return res.status(200).json({ data: result.data })
    } catch (error) {
      console.error('Error finding carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}