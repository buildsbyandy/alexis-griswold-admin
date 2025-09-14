import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('storefront_products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) return res.status(500).json({ error: 'Failed to fetch storefront products' })
    return res.status(200).json({ products: data })
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const { data, error } = await supabaseAdmin
      .from('storefront_products')
      .insert(req.body)
      .select('*')
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to create product' })
    return res.status(201).json({ product: data })
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}