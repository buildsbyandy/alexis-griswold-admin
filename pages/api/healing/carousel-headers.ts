import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('video_carousels')
      .select('*')
      .eq('page_type', 'healing')
      .order('carousel_number', { ascending: true })
    
    if (error) return res.status(500).json({ error: 'Failed to fetch carousel headers' })
    return res.status(200).json({ headers: data })
  }

  if (req.method === 'PUT') {
    const { type, title, description, isActive } = req.body
    const carouselNumber = type === 'part1' ? 1 : 2

    // Update or create carousel header
    const { data, error } = await supabaseAdmin
      .from('video_carousels')
      .upsert({
        page_type: 'healing',
        carousel_number: carouselNumber,
        header: title,
        subtitle: description,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to update carousel header' })
    return res.status(200).json({ header: data })
  }

  res.setHeader('Allow', 'GET,PUT')
  return res.status(405).json({ error: 'Method Not Allowed' })
}