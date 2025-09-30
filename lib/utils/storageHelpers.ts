import { parseSupabaseUrl } from '@/util/imageUrl';

export type ContentStatus = 'published' | 'draft' | 'archived';
export type ContentType = 'recipe' | 'vlog' | 'healing' | 'product' | 'homepage' | 'general';
export type MediaType = 'image' | 'video' | 'thumbnail';

/**
 * Determines the appropriate bucket based on content status
 */
export function getBucketForStatus(status: ContentStatus): string {
  return status === 'published' ? 'public' : 'private';
}

/**
 * Determines the folder path based on content type, media type, and status
 */
export function getStoragePath(
  contentType: ContentType,
  mediaType: MediaType,
  status: ContentStatus,
  customPath?: string
): { bucket: string; folder: string } {
  const bucket = getBucketForStatus(status);

  let folder: string;

  if (customPath) {
    folder = customPath;
  } else if (mediaType === 'thumbnail') {
    if (contentType === 'vlog') {
      folder = 'images/vlogs';
    } else if (contentType === 'healing') {
      folder = 'images/healing';
    } else if (contentType === 'recipe') {
      folder = 'images/recipes';
    } else {
      folder = 'images';
    }
  } else if (mediaType === 'video') {
    if (contentType === 'homepage') {
      folder = 'videos/home';
    } else if (status === 'published') {
      folder = `videos/${contentType}`;
    } else {
      folder = 'drafts/videos';
    }
  } else { // mediaType === 'image'
    if (contentType === 'general') {
      folder = status === 'published' ? 'images' : 'uploads';
    } else if (contentType === 'product') {
      folder = 'images/storefront';
    } else if (status === 'published') {
      folder = `images/${contentType}`;
    } else {
      folder = 'drafts/images';
    }
  }

  return { bucket, folder };
}

/**
 * Creates a signed URL for private media content
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const response = await fetch('/api/storage/get-signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, path, expiresIn })
    });

    if (!response.ok) {
      console.error('Failed to get signed URL:', response.status);
      return null;
    }

    const data = await response.json();
    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

/**
 * Gets the appropriate URL for media content (public URL or signed URL)
 */
export async function getMediaUrl(
  url: string,
  forceSignedUrl: boolean = false
): Promise<string | null> {
  if (!url) return null;

  const parsedUrl = parseSupabaseUrl(url);
  if (!parsedUrl) return url; // Return as-is if not a Supabase URL

  const { bucket, path } = parsedUrl;

  // Use public URL for public bucket unless forced to use signed URL
  if (bucket === 'public' && !forceSignedUrl) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }

  // Use signed URL for private or when forced
  return await createSignedUrl(bucket, path);
}

/**
 * Creates YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Gets thumbnail URL with fallback logic
 * Priority: Custom thumbnail → YouTube thumbnail → null
 */
export async function getThumbnailUrl(
  customThumbnailUrl?: string | null,
  youtubeVideoId?: string | null
): Promise<string | null> {
  // Try custom thumbnail first
  if (customThumbnailUrl) {
    const thumbnailUrl = await getMediaUrl(customThumbnailUrl);
    if (thumbnailUrl) return thumbnailUrl;
  }

  // Fallback to YouTube thumbnail
  if (youtubeVideoId) {
    return getYouTubeThumbnailUrl(youtubeVideoId);
  }

  return null;
}

/**
 * Migrates a URL from old bucket structure to new bucket structure
 */
export function migrateUrl(
  oldUrl: string,
  contentType: ContentType,
  mediaType: MediaType,
  status: ContentStatus
): string {
  const parsedUrl = parseSupabaseUrl(oldUrl);
  if (!parsedUrl) return oldUrl;

  // If already using new bucket structure, return as-is
  if (parsedUrl.bucket === 'public' || parsedUrl.bucket === 'private') {
    return oldUrl;
  }

  // Extract filename from old path
  const pathParts = parsedUrl.path.split('/');
  const filename = pathParts[pathParts.length - 1];

  // Get new storage path
  const { bucket, folder } = getStoragePath(contentType, mediaType, status);
  const newPath = `${folder}/${filename}`;

  // Construct new URL
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${newPath}`;
}