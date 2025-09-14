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

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Recipe ID required' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Recipe not found' })
      return res.status(500).json({ error: 'Failed to fetch recipe' })
    }
    return res.status(200).json({ recipe: data })
  }

  if (req.method === 'PUT') {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update(req.body)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Recipe not found' })
      return res.status(500).json({ error: 'Failed to update recipe' })
    }
    return res.status(200).json({ recipe: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('id', id)
    
    if (error) return res.status(500).json({ error: 'Failed to delete recipe' })
    return res.status(200).json({ message: 'Recipe deleted successfully' })
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}