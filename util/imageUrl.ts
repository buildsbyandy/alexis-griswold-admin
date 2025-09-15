/**
 * Client-safe image URL utilities
 * Fetches signed URLs from server API and provides canonical path building
 */

interface SignedUrlResponse {
  signedUrl: string
  error?: string
}

/**
 * Get a signed URL for viewing an image from Supabase Storage
 * This function is safe to use in client components as it calls the server API
 */
export async function getImageSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 600
): Promise<string> {
  const response = await fetch('/api/storage/get-signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, expiresIn })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to get signed URL: ${errorData.error || response.statusText}`)
  }

  const data: SignedUrlResponse = await response.json()
  if (data.error) {
    throw new Error(`Signed URL error: ${data.error}`)
  }

  return data.signedUrl
}

/**
 * Build canonical public path for an image (for logging/debug only)
 * DO NOT use this for actual image display - use getImageSignedUrl instead
 */
export function buildCanonicalImagePath(bucket: string, path: string): string {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Parse a Supabase public URL to extract bucket and path
 * Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 */
export function parseSupabaseUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')

    // Expected format: /storage/v1/object/public/[bucket]/[...path]
    if (pathParts.length < 6 || pathParts[1] !== 'storage' || pathParts[4] !== 'public') {
      return null
    }

    const bucket = pathParts[5]
    const path = pathParts.slice(6).join('/')

    if (!bucket || !path) {
      return null
    }

    return { bucket, path }
  } catch {
    return null
  }
}

/**
 * Legacy imageUrl function - deprecated
 * @deprecated Use getImageSignedUrl instead for secure access
 */
export function imageUrl(bucket: string, path: string, w = 1200): string {
  console.warn('imageUrl is deprecated. Use getImageSignedUrl for secure access or buildCanonicalImagePath for debugging.')
  return buildCanonicalImagePath(bucket, path)
}
