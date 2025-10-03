import { useState, useEffect } from 'react';

/**
 * Hook for managing local file previews before upload
 * Creates object URLs for immediate preview without uploading to server
 */
export interface FilePreview {
  file: File;
  previewUrl: string;
  id: string; // Unique identifier for tracking
}

export function useFilePreview() {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  // Cleanup object URLs on unmount or when previews change
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, [previews]);

  /**
   * Add file(s) for preview
   */
  const addFiles = (files: File | File[]): FilePreview[] => {
    const fileArray = Array.isArray(files) ? files : [files];

    const newPreviews: FilePreview[] = fileArray.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
    return newPreviews;
  };

  /**
   * Remove a preview by ID
   */
  const removePreview = (id: string) => {
    setPreviews(prev => {
      const preview = prev.find(p => p.id === id);
      if (preview) {
        URL.revokeObjectURL(preview.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  /**
   * Clear all previews
   */
  const clearPreviews = () => {
    previews.forEach(preview => {
      URL.revokeObjectURL(preview.previewUrl);
    });
    setPreviews([]);
  };

  /**
   * Replace a preview at a specific index
   */
  const replacePreview = (index: number, file: File): FilePreview | null => {
    if (index < 0 || index >= previews.length) return null;

    const oldPreview = previews[index];
    URL.revokeObjectURL(oldPreview.previewUrl);

    const newPreview: FilePreview = {
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    setPreviews(prev => {
      const updated = [...prev];
      updated[index] = newPreview;
      return updated;
    });

    return newPreview;
  };

  /**
   * Get all files for upload
   */
  const getFiles = (): File[] => {
    return previews.map(p => p.file);
  };

  return {
    previews,
    addFiles,
    removePreview,
    clearPreviews,
    replacePreview,
    getFiles
  };
}
