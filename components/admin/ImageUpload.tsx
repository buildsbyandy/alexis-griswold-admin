/**
 * Image Upload Component
 * Handles file selection, validation, and direct S3 upload
 * Features: Drag & drop, preview, progress tracking, multiple files
 */

import React, { useState, useCallback, useRef } from 'react'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import SecureImage from './SecureImage'
import { parseSupabaseUrl } from '@/util/imageUrl'

interface ImageUploadProps {
  /** Current image URLs */
  value?: string[]
  /** Callback when images change */
  onChange: (urls: string[]) => void
  /** Maximum number of images allowed */
  maxImages?: number
  /** Upload folder for organization */
  folder?: 'vlogs' | 'recipes' | 'products' | 'playlists' | 'albums' | 'general'
  /** Accept specific file types */
  accept?: string
  /** Custom placeholder text */
  placeholder?: string
  /** Disable the upload component */
  disabled?: boolean
  /** Show image preview */
  showPreview?: boolean
  /** Custom class name */
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
}

export default function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  folder = 'general',
  accept = 'image/*',
  placeholder = 'Click to upload or drag and drop images',
  disabled = false,
  showPreview = true,
  className,
}: ImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if we can add more images
  const canAddMore = value.length + uploadingFiles.length < maxImages

  async function uploadToSupabase(file: File, folder = 'recipes') {
    const ext = file.name.slice(file.name.lastIndexOf('.')) || ''
    const path = `${folder}/${crypto.randomUUID()}${ext}`

    // 1) get a signed upload URL/token from our API
    const res = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'media', path })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to get upload URL: ${errorText}`)
    }

    const { uploadUrl, publicUrl } = await res.json()

    // 2) upload directly to Supabase using the signed URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file: ${uploadRes.statusText}`)
    }

    return { path, publicUrl }
  }

  /**
   * Upload file to Supabase Storage using signed upload URL
   */
  const uploadFile = useCallback(async (
    file: File,
    folder: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    const { path, publicUrl } = await uploadToSupabase(file, folder)
    // We cannot stream progress here; set to 100% on completion
    onProgress(100)
    return publicUrl
  }, [])

  /**
   * Handle file selection from input or drag & drop
   */
  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }

      return true
    })

    // Check total file count
    const totalFiles = value.length + uploadingFiles.length + validFiles.length
    if (totalFiles > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    if (validFiles.length === 0) return

    // Create uploading file objects
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'uploading',
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Upload each file
    for (const uploadingFile of newUploadingFiles) {
      try {
        const url = await uploadFile(uploadingFile.file, folder, (progress) => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, progress }
                : f
            )
          )
        })

        // Mark as successful and add to value
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, status: 'success', url, progress: 100 }
              : f
          )
        )

        // Add to the final value
        onChange([...value, url])

        toast.success(`${uploadingFile.file.name} uploaded successfully`)
      } catch (error) {
        console.error('Upload error:', error)
        
        // Mark as error
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, status: 'error' }
              : f
          )
        )

        toast.error(`Failed to upload ${uploadingFile.file.name}`)
      }
    }

    // Clean up completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.status === 'uploading'))
    }, 3000)
  }, [disabled, value, uploadingFiles.length, maxImages, folder, onChange, uploadFile])

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && canAddMore) {
      setIsDragOver(true)
    }
  }, [disabled, canAddMore])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!disabled && canAddMore && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, canAddMore, handleFiles])

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = ''
  }, [handleFiles])

  /**
   * Remove an image from the list
   */
  const removeImage = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }, [value, onChange])

  /**
   * Trigger file input click
   */
  const triggerFileInput = useCallback(() => {
    if (!disabled && canAddMore) {
      fileInputRef.current?.click()
    }
  }, [disabled, canAddMore])

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragOver && canAddMore
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300',
          disabled
            ? 'bg-gray-50 cursor-not-allowed'
            : canAddMore
            ? 'hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
            : 'bg-gray-50 cursor-not-allowed',
          !canAddMore && 'opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || !canAddMore}
          className="hidden"
        />

        <div className="text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">
              {placeholder}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP up to 10MB ({value.length}/{maxImages})
            </p>
          </div>
          {canAddMore && (
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors"
              disabled={disabled}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Choose Files
            </button>
          )}
        </div>
      </div>

      {/* Uploading Files Progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map((uploadingFile) => (
              <motion.div
                key={uploadingFile.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {uploadingFile.file.name}
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-1 rounded-full',
                    uploadingFile.status === 'uploading' && 'bg-blue-100 text-blue-800',
                    uploadingFile.status === 'success' && 'bg-green-100 text-green-800',
                    uploadingFile.status === 'error' && 'bg-red-100 text-red-800'
                  )}>
                    {uploadingFile.status === 'uploading' && `${uploadingFile.progress}%`}
                    {uploadingFile.status === 'success' && 'Uploaded'}
                    {uploadingFile.status === 'error' && 'Failed'}
                  </span>
                </div>
                {uploadingFile.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Grid */}
      {showPreview && value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {value.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
{(() => {
                  const parsedUrl = parseSupabaseUrl(url)
                  if (parsedUrl) {
                    return (
                      <SecureImage
                        bucket={parsedUrl.bucket}
                        path={parsedUrl.path}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => {
                          toast.error(`Failed to load image ${index + 1}`)
                        }}
                      />
                    )
                  } else {
                    return (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Invalid URL</span>
                      </div>
                    )
                  }
                })()}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(index)
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}