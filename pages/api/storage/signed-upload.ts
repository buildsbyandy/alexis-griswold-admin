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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { path, contentType, bucket = 'media' } = req.body as { path: string; contentType?: string; bucket?: string }
  if (!path) return res.status(400).json({ error: 'Missing path' })

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error) return res.status(500).json({ error: 'Failed to create signed URL' })
  return res.status(200).json(data)
}

