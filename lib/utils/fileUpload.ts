interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploadService {
  private static async getSignedUploadUrl(path: string, contentType?: string): Promise<{ signedUrl: string; path: string }> {
    const response = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, contentType })
    });

    if (!response.ok) throw new Error('Failed to get signed upload URL');
    return response.json();
  }

  static async uploadFile(file: File, folder: string = 'uploads'): Promise<UploadResponse> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      
      const { signedUrl, path } = await this.getSignedUploadUrl(filePath, file.type);
      
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
      
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
    if (!file.type.startsWith('video/')) {
      return { success: false, error: 'File must be a video' };
    }
    return this.uploadFile(file, 'videos');
  }

  static async uploadImage(file: File): Promise<UploadResponse> {
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }
    return this.uploadFile(file, 'images');
  }
}

export default FileUploadService;