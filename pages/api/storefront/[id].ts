import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  // All operations require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      // Remove undefined fields from the update
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== undefined)
      )
      
      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) {
        console.error('Supabase update error:', error)
        return res.status(500).json({ error: 'Failed to update product' })
      }
      
      return res.status(200).json({ product: data })
    } catch (error) {
      console.error('Update error:', error)
      return res.status(500).json({ error: 'Failed to update product' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('storefront_products')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase delete error:', error)
        return res.status(500).json({ error: 'Failed to delete product' })
      }
      
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Delete error:', error)
      return res.status(500).json({ error: 'Failed to delete product' })
    }
  }

  res.setHeader('Allow', 'PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}