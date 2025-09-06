interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploadService {
  private static async getSignedUploadUrl(path: string, contentType?: string, bucket: string = 'media'): Promise<{ signedUrl: string; path: string }> {
    const response = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, contentType, bucket })
    });

    if (!response.ok) throw new Error('Failed to get signed upload URL');
    return response.json();
  }

  static async uploadFile(file: File, folder: string = 'uploads', bucket: string = 'media'): Promise<UploadResponse> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      
      const { signedUrl, path } = await this.getSignedUploadUrl(filePath, file.type, bucket);
      
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      
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

  static async uploadVideo(file: File): Promise<UploadResponse> {
    // Get file extension for additional validation
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
    return this.uploadFile(file, 'videos', 'media');
  }

  static async uploadImage(file: File): Promise<UploadResponse> {
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }
    return this.uploadFile(file, 'images', 'media');
  }
}

export default FileUploadService;