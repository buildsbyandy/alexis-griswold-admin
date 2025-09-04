import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import isAdminEmail from '../../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('healing_products')
      .select('*')
      .order('product_order', { ascending: true })
    
    if (error) return res.status(500).json({ error: 'Failed to fetch healing products' })
    return res.status(200).json({ products: data })
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    // Map from modal interface to database fields
    const productData = {
      product_title: req.body.name,
      product_purpose: req.body.purpose,
      how_to_use: req.body.howToUse,
      product_image_path: req.body.imageUrl,
      amazonUrl: req.body.amazonUrl,
      is_active: req.body.isActive,
      product_order: req.body.order,
      status: req.body.isActive ? 'published' : 'draft'
    }
    
    const { data, error } = await supabaseAdmin
      .from('healing_products')
      .insert(productData)
      .select('*')
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to create healing product' })
    return res.status(201).json({ product: data })
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}