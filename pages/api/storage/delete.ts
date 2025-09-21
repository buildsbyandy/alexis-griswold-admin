import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import { parseSupabaseUrl } from '@/util/imageUrl'

export const config = { runtime: 'nodejs' }

interface DeleteRequest {
  url: string
}

interface DeleteResponse {
  success?: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteResponse>
) {
  // Authentication check
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Method check
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { url } = req.body as DeleteRequest

  // Validate required parameters
  if (!url) {
    return res.status(400).json({ error: 'Missing URL' })
  }

  // Parse the Supabase URL to extract bucket and path
  const parsedUrl = parseSupabaseUrl(url)
  if (!parsedUrl) {
    return res.status(400).json({ error: 'Invalid Supabase URL format' })
  }

  const { bucket, path } = parsedUrl

  // Whitelist allowed buckets for security
  const allowedBuckets = ['public_media', 'private_media', 'media'] // Keep 'media' for backward compatibility
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' })
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Supabase delete error:', error)
      return res.status(500).json({ error: 'Failed to delete file' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting file:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}