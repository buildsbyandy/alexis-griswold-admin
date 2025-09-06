import React from 'react'
import { FaPlay, FaTrash, FaClock } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface VideoHistoryItem {
  path: string
  uploaded_at: string
  title: string
  size?: number
}

interface VideoHistoryCarouselProps {
  currentVideo?: string
  videoHistory: VideoHistoryItem[]
  onVideoSelect: (videoPath: string) => void
  onVideoDelete: (videoPath: string) => void
  onRefresh: () => void
}

const VideoHistoryCarousel: React.FC<VideoHistoryCarouselProps> = ({
  currentVideo,
  videoHistory,
  onVideoSelect,
  onVideoDelete,
  onRefresh
}) => {
  
  const handleDelete = async (videoPath: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering video select
    
    if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/home', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath })
      })

      if (response.ok) {
        toast.success('Video deleted successfully')
        onVideoDelete(videoPath)
        onRefresh()
      } else {
        throw new Error('Failed to delete video')
      }
    } catch (error) {
      toast.error('Failed to delete video')
      console.error('Delete error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (videoHistory.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <FaClock className="mx-auto text-gray-400 text-2xl mb-2" />
        <p className="text-gray-500 text-sm">No video history yet</p>
        <p className="text-gray-400 text-xs">Upload a new video to start building history</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center">
        <FaClock className="mr-2" />
        Video History ({videoHistory.length}/3)
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {videoHistory.map((video, index) => (
          <div
            key={video.path}
            className={`
              relative group cursor-pointer rounded-lg border-2 transition-all duration-200
              ${currentVideo === video.path 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
            onClick={() => onVideoSelect(video.path)}
          >
            <div className="p-3 flex items-center space-x-3">
              {/* Video Preview */}
              <div className="relative w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <video
                  src={video.path}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaPlay className="text-white text-sm" />
                </div>
              </div>
              
              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {video.title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(video.uploaded_at)}
                </p>
                {currentVideo === video.path && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                    Current
                  </span>
                )}
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(video.path, e)}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                title="Delete video"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-400 mt-2">
        Click any video to make it the current background. Maximum 3 videos kept in history.
      </div>
    </div>
  )
}

export default VideoHistoryCarousel