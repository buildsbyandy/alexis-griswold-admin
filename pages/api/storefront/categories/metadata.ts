import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type CategoryRow = Database['public']['Tables']['storefront_categories']['Row']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { ids } = req.query

      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ error: 'IDs parameter is required' })
      }

      const categoryIds = ids.split(',').filter(Boolean)
      if (categoryIds.length === 0) {
        return res.status(200).json({ categories: [] })
      }

      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .select('*')
        .in('id', categoryIds)

      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch category metadata' })
      }

      return res.status(200).json({ categories: data as CategoryRow[] })
    } catch (error) {
      console.error('Category metadata fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch category metadata' })
    }
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method Not Allowed' })
}