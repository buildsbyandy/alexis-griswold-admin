import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type CarouselInsert = Database['public']['Tables']['carousels']['Insert']
export type CarouselUpdate = Database['public']['Tables']['carousels']['Update']
export type PageType = Database['public']['Enums']['page_type']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { page, slug } = req.query

      if (!page || typeof page !== 'string') {
        return res.status(400).json({ error: 'Page parameter is required' })
      }

      let query = supabase.from('carousels').select('*').eq('page', page as PageType).order('updated_at', { ascending: false })
      if (slug && typeof slug === 'string') {
        query = query.eq('slug', slug)
      }

      const { data, error } = await query
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data: data || [] })
    } catch (error) {
      console.error('Error fetching carousels:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { page, slug, title, description, is_active = true } = req.body

      if (!page || !slug) {
        return res.status(400).json({ error: 'Page and slug are required' })
      }

      const nowIso = new Date().toISOString()
      const payload: CarouselInsert = {
        page,
        slug,
        title: title ?? null,
        description: description ?? null,
        is_active,
        created_at: nowIso,
        updated_at: nowIso,
      }

      const { data, error } = await supabase.from('carousels').insert(payload).select('*').single()
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ data })
    } catch (error) {
      console.error('Error creating carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}