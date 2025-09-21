import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { FileUploadService } from '../../lib/utils/fileUpload';
import toast from 'react-hot-toast';

interface FileUploadProps {
  accept: string;
  onUpload: (url: string) => void;
  uploadType: 'video' | 'image' | 'file';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  folder?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  accept, 
  onUpload, 
  uploadType, 
  className = '',
  children,
  disabled = false,
  folder
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
      switch (uploadType) {
        case 'video':
          result = await FileUploadService.uploadVideo(file);
          break;
        case 'image':
          result = await FileUploadService.uploadImage(file, folder);
          break;
        default:
          result = await FileUploadService.uploadFile(file, folder);
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