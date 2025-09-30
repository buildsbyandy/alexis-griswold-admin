import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type ProductRow = Database['public']['Tables']['storefront_products']['Row']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { ids } = req.query

      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ error: 'IDs parameter is required' })
      }

      const productIds = ids.split(',').filter(Boolean)
      if (productIds.length === 0) {
        return res.status(200).json({ products: [] })
      }

      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .select('*')
        .in('id', productIds)
        .is('deleted_at', null) // Only include non-deleted products

      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ error: 'Failed to fetch product metadata' })
      }

      return res.status(200).json({ products: data as ProductRow[] })
    } catch (error) {
      console.error('Product metadata fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch product metadata' })
    }
  }

  res.setHeader('Allow', 'GET')
  return res.status(405).json({ error: 'Method Not Allowed' })
}