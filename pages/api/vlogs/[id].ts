import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('vlogs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to fetch vlog' })
    return res.status(200).json({ vlog: data })
  }

  if (req.method === 'PUT') {
    const { data, error } = await supabaseAdmin
      .from('vlogs')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) return res.status(500).json({ error: 'Failed to update vlog' })
    return res.status(200).json({ vlog: data })
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('vlogs')
      .delete()
      .eq('id', id)
    
    if (error) return res.status(500).json({ error: 'Failed to delete vlog' })
    return res.status(200).json({ message: 'Vlog deleted successfully' })
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}