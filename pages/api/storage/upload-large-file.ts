import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import { supabase as supabaseAdmin } from '@/lib/supabase'
import formidable from 'formidable'
import fs from 'fs'

// Disable Next.js body parser to handle multipart/form-data with formidable
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max (adjust as needed)
    })

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    // Extract form fields
    const bucket = Array.isArray(fields.bucket) ? fields.bucket[0] : fields.bucket
    const path = Array.isArray(fields.path) ? fields.path[0] : fields.path
    const contentType = Array.isArray(fields.contentType) ? fields.contentType[0] : fields.contentType

    // Extract the file
    const fileArray = files.file
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' })
    }
    const file = fileArray[0]

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Missing bucket or path' })
    }

    // Whitelist allowed buckets for security
    const allowedBuckets = ['public', 'private']
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: 'Invalid bucket' })
    }

    console.log('Server-side upload starting:', {
      bucket,
      path,
      fileSize: file.size,
      contentType
    })

    // Read the file from disk
    const fileBuffer = fs.readFileSync(file.filepath)

    // Upload to Supabase using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: contentType || file.mimetype || 'application/octet-stream',
        upsert: false,
      })

    // Clean up the temp file
    fs.unlinkSync(file.filepath)

    if (error) {
      console.error('Supabase storage upload error:', error)
      return res.status(500).json({ error: 'Failed to upload file to storage', details: error })
    }

    // Generate public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`

    console.log('Server-side upload successful:', publicUrl)

    return res.status(200).json({ url: publicUrl, path: data.path })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
