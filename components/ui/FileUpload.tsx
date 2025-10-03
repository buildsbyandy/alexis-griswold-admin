import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { FileUploadService } from '../../lib/utils/fileUpload';
import toast from 'react-hot-toast';
import type { StoragePath } from '@/lib/constants/storagePaths';

interface FileUploadProps {
  accept: string;
  onUpload: (url: string) => void;
  uploadType: 'video' | 'image' | 'file';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  folder?: StoragePath;
  contentStatus?: 'published' | 'draft' | 'archived'; // Optional: Pass content status for correct bucket routing
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  onUpload,
  uploadType,
  className = '',
  children,
  disabled = false,
  folder,
  contentStatus
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.loading('Uploading file...', { id: 'upload' });

    try {
      let result;

      // Determine content type and status from folder context
      let contentType: 'recipe' | 'product' | 'healing' | 'vlog' | 'homepage' | 'general' = 'general';
      // Use passed contentStatus if available, otherwise default to draft for safety
      // Note: archived content should also use private bucket (same as draft)
      let status: 'published' | 'draft' | 'archived' = contentStatus || 'draft';

      // Map folder to content type
      if (folder?.includes('recipe')) contentType = 'recipe';
      else if (folder?.includes('product')) contentType = 'product';
      else if (folder?.includes('healing')) contentType = 'healing';
      else if (folder?.includes('vlog')) contentType = 'vlog';
      else if (folder?.includes('home') || folder?.includes('homepage')) {
        contentType = 'homepage';
        status = 'published'; // Homepage content is always published (public bucket)
      }
      else if (folder?.includes('thumbnail')) {
        // Handle thumbnail uploads
        if (folder.includes('vlogs')) contentType = 'vlog';
        else if (folder.includes('healing')) contentType = 'healing';
        else if (folder.includes('recipe')) contentType = 'recipe';
      }

      switch (uploadType) {
        case 'video':
          result = await FileUploadService.uploadVideo(file, contentType, status);
          break;
        case 'image':
          if (folder?.includes('albums')) {
            result = await FileUploadService.uploadAlbumPhoto(file);
          } else if (folder?.includes('thumbnail')) {
            // Handle thumbnail uploads with content ID for proper naming
            const contentId = `thumb-${Date.now()}`;
            if (contentType === 'vlog' || contentType === 'healing') {
              result = await FileUploadService.uploadThumbnail(file, contentType, contentId, status);
            } else {
              result = await FileUploadService.uploadImage(file, contentType, status);
            }
          } else {
            result = await FileUploadService.uploadImage(file, contentType, status);
          }
          break;
        default:
          result = await FileUploadService.uploadFile(file, {
            contentType,
            status,
            customPath: folder
          });
      }

      if (result.success && result.url) {
        onUpload(result.url);
        toast.success('File uploaded successfully!', { id: 'upload' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: 'upload' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={disabled || uploading}
        className={`flex items-center gap-2 ${className}`}
        type="button"
      >
        {uploading ? (
          <FaSpinner className="animate-spin" />
        ) : (
          <FaUpload />
        )}
        {children || (uploading ? 'Uploading...' : 'Upload File')}
      </button>
    </>
  );
};

export default FileUpload;