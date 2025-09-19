import type { NextApiRequest, NextApiResponse } from 'next'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type PageType = Database['public']['Enums']['page_type']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page, slug } = req.query

      if (!page || typeof page !== 'string') {
        return res.status(400).json({ error: 'Page parameter is required' })
      }

      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Slug parameter is required' })
      }

      const { data, error } = await supabase
        .from('carousels')
        .select('*')
        .eq('page', page as PageType)
        .eq('slug', slug)
        .single()

      if (error) {
        // If not found, supabase returns error; treat as null when code is PGRST116
        if ((error as any).code === 'PGRST116') {
          return res.status(200).json({ data: null })
        }
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data })
    } catch (error) {
      console.error('Error finding carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}