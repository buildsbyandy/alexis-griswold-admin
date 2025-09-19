import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type CarouselUpdate = Database['public']['Tables']['carousels']['Update']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Carousel ID is required' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('carousels').select('*').eq('id', id).single()
      if (error) {
        if ((error as any).code === 'PGRST116') {
          return res.status(404).json({ error: 'Carousel not found' })
        }
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data })
    } catch (error) {
      console.error('Error fetching carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { title, description, is_active } = req.body

      const payload: CarouselUpdate = {
        title: title ?? undefined,
        description: description ?? undefined,
        is_active: is_active ?? undefined,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('carousels').update(payload).eq('id', id).select('*').single()
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data })
    } catch (error) {
      console.error('Error updating carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { error } = await supabase.from('carousels').delete().eq('id', id)
      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data: null })
    } catch (error) {
      console.error('Error deleting carousel:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}