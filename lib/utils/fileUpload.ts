import {
  getStoragePath,
  getBucketForStatus,
  type ContentStatus,
  type ContentType,
  type MediaType
} from './storageHelpers';

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface UploadOptions {
  contentType?: ContentType;
  mediaType?: MediaType;
  status?: ContentStatus;
  contentId?: string;
  customPath?: string;
}

export class FileUploadService {
  private static async getSignedUploadUrl(
    path: string,
    contentType?: string,
    bucket: string = 'public'
  ): Promise<{ signedUrl: string; path: string }> {
    const response = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, contentType, bucket })
    });

    if (!response.ok) throw new Error('Failed to get signed upload URL');
    const data = await response.json();
    return { signedUrl: data.uploadUrl, path };
  }

  /**
   * Generic file upload with new bucket structure support
   */
  static async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const {
        contentType = 'general',
        mediaType = 'image',
        status = 'draft',
        contentId,
        customPath
      } = options;

      const fileExtension = file.name.split('.').pop();
      const fileName = contentId
        ? `${contentId}-${Date.now()}.${fileExtension}`
        : `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

      // Get storage path based on content type, media type, and status
      const { bucket, folder } = customPath
        ? { bucket: getBucketForStatus(status), folder: customPath }
        : getStoragePath(contentType, mediaType, status);

      const filePath = `${folder}/${fileName}`;

      console.log('Starting upload process:', {
        fileName,
        filePath,
        bucket,
        fileSize: file.size,
        fileType: file.type,
        contentType,
        mediaType,
        status
      });

      const { signedUrl, path } = await this.getSignedUploadUrl(filePath, file.type, bucket);
      console.log('Got signed URL:', { path, bucket, signedUrlLength: signedUrl.length });

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      console.log('Upload successful, public URL:', publicUrl);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload video with content-aware bucket selection
   */
  static async uploadVideo(
    file: File,
    contentType: ContentType = 'general',
    status: ContentStatus = 'draft'
  ): Promise<UploadResponse> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'mkv'];

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size: 25MB. Please compress your video first.`
      };
    }

    // Check MIME type OR file extension for video validation
    const isVideo = file.type.startsWith('video/') || videoExtensions.includes(fileExtension || '');

    if (!isVideo) {
      return { success: false, error: `File must be a video. Supported formats: ${videoExtensions.join(', ').toUpperCase()}` };
    }

    return this.uploadFile(file, {
      contentType,
      mediaType: 'video',
      status
    });
  }

  /**
   * Upload image with content-aware bucket selection
   */
  static async uploadImage(
    file: File,
    contentType: ContentType = 'general',
    status: ContentStatus = 'draft'
  ): Promise<UploadResponse> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'];
    const problematicExtensions = ['tiff', 'tif', 'raw', 'cr2', 'nef', 'arw', 'dng', 'psd'];

    // Check file size (10MB limit for images)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Image too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size: 10MB. Please compress or resize your image.`
      };
    }

    // Warn about problematic file types
    if (problematicExtensions.includes(fileExtension || '')) {
      return {
        success: false,
        error: `${fileExtension?.toUpperCase()} files are not web-optimized. Please convert to JPG, PNG, or WebP format first.`
      };
    }

    // Check MIME type OR file extension for image validation
    const isImage = file.type.startsWith('image/') || imageExtensions.includes(fileExtension || '');

    if (!isImage) {
      return { success: false, error: `File must be an image. Supported formats: ${imageExtensions.join(', ').toUpperCase()}` };
    }

    return this.uploadFile(file, {
      contentType,
      mediaType: 'image',
      status
    });
  }

  /**
   * Upload custom thumbnail for YouTube videos
   */
  static async uploadThumbnail(
    file: File,
    contentType: 'vlog' | 'healing',
    contentId: string,
    status: ContentStatus = 'draft'
  ): Promise<UploadResponse> {
    // Validate it's an image first
    const imageValidation = await this.uploadImage(file, contentType, status);
    if (!imageValidation.success) {
      return imageValidation;
    }

    return this.uploadFile(file, {
      contentType,
      mediaType: 'thumbnail',
      status,
      contentId
    });
  }

  /**
   * Upload homepage content (always public)
   */
  static async uploadHomepageContent(
    file: File,
    mediaType: MediaType = 'image'
  ): Promise<UploadResponse> {
    return this.uploadFile(file, {
      contentType: 'homepage',
      mediaType,
      status: 'published' // Homepage content is always published
    });
  }

  /**
   * Upload album photos (always public)
   */
  static async uploadAlbumPhoto(file: File): Promise<UploadResponse> {
    return this.uploadFile(file, {
      contentType: 'general',
      mediaType: 'image',
      status: 'published', // Albums are always public
      customPath: 'albums'
    });
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(url: string): Promise<boolean> {
    try {
      const response = await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export default FileUploadService;