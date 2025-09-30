import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'

export const config = { runtime: 'nodejs' }

interface GetSignedUrlRequest {
  bucket: string
  path: string
  expiresIn?: number
}

interface GetSignedUrlResponse {
  signedUrl?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetSignedUrlResponse>
) {
  // Authentication check
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Method check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { bucket, path, expiresIn = 600 } = req.body as GetSignedUrlRequest

  // Validate required parameters
  if (!bucket || !path) {
    return res.status(400).json({ error: 'Missing bucket or path' })
  }

  // Whitelist allowed buckets for security
  const allowedBuckets = ['public', 'private', 'media'] // Keep 'media' for backward compatibility
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' })
  }

  // Validate expiresIn (max 1 hour for security)
  if (expiresIn < 60 || expiresIn > 3600) {
    return res.status(400).json({ error: 'expiresIn must be between 60 and 3600 seconds' })
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Supabase signed URL error:', error)
      return res.status(500).json({ error: 'Failed to create signed URL' })
    }

    if (!data?.signedUrl) {
      return res.status(500).json({ error: 'No signed URL returned' })
    }

    return res.status(200).json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error('Unexpected error creating signed URL:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}