import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import { supabase as supabaseAdmin } from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { path, contentType, bucket = 'public' } = req.body as { path: string; contentType?: string; bucket?: string }
  if (!path) return res.status(400).json({ error: 'Missing path' })

  // Whitelist allowed buckets for security
  const allowedBuckets = ['public', 'private']
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' })
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error) return res.status(500).json({ error: 'Failed to create signed URL' })
  
  // Return the expected format with uploadUrl and publicUrl
  return res.status(200).json({
    uploadUrl: data.signedUrl,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  })
}

