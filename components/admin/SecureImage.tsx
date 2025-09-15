import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { getImageSignedUrl } from '@/util/imageUrl'

interface SecureImageProps {
  bucket: string
  path: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  onError?: () => void
  expiresIn?: number
}

export default function SecureImage({
  bucket,
  path,
  alt,
  className,
  fill,
  sizes,
  width,
  height,
  onError,
  expiresIn = 600
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchSignedUrl() {
      try {
        setLoading(true)
        setError(null)
        const url = await getImageSignedUrl(bucket, path, expiresIn)
        if (isMounted) {
          setSignedUrl(url)
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load image'
          setError(errorMessage)
          onError?.()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSignedUrl()

    return () => {
      isMounted = false
    }
  }, [bucket, path, expiresIn, onError])

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className || ''}`} {...(fill ? {} : { style: { width, height } })}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 ${className || ''}`} {...(fill ? {} : { style: { width, height } })}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-sm text-center px-2">
            {error || 'Failed to load image'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={signedUrl}
      alt={alt}
      className={className}
      fill={fill}
      sizes={sizes}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      onError={() => {
        setError('Image failed to load')
        onError?.()
      }}
    />
  )
}