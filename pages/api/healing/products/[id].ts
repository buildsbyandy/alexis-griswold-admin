import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('healing_products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to fetch healing product' })
    return res.status(200).json({ product: data })
  }

  if (req.method === 'PUT') {
    // Map from modal interface to database fields
    const productData = {
      product_title: req.body.name,
      product_purpose: req.body.purpose,
      how_to_use: req.body.howToUse,
      product_image_path: req.body.imageUrl,
      amazonUrl: req.body.amazonUrl,
      is_active: req.body.isActive,
      product_order: req.body.order,
      status: req.body.isActive ? 'published' : 'draft',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('healing_products')
      .update(productData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to update healing product' })
    return res.status(200).json({ product: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('healing_products')
      .delete()
      .eq('id', id)
    
    if (error) return res.status(500).json({ error: 'Failed to delete healing product' })
    return res.status(200).json({ message: 'Healing product deleted successfully' })
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}