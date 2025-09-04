import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo, FaYoutube } from 'react-icons/fa';
import toast from 'react-hot-toast';

export interface HealingFeaturedVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  isActive: boolean;
  updatedAt: Date;
}

interface HealingFeaturedVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo?: HealingFeaturedVideo | null;
  onSave: (video: Omit<HealingFeaturedVideo, 'id' | 'updatedAt'>) => Promise<void>;
}

const HealingFeaturedVideoModal: React.FC<HealingFeaturedVideoModalProps> = ({ 
  isOpen, 
  onClose, 
  currentVideo, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '',
    publishedAt: '',
    isActive: true,
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (currentVideo) {
      setFormData({
        title: currentVideo.title,
        description: currentVideo.description,
        videoUrl: currentVideo.videoUrl,
        thumbnailUrl: currentVideo.thumbnailUrl,
        duration: currentVideo.duration,
        publishedAt: currentVideo.publishedAt,
        isActive: currentVideo.isActive,
      });
    } else {
      // Reset form for new video
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: '',
        publishedAt: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }
  }, [currentVideo]);

  // Extract YouTube ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Auto-generate thumbnail from YouTube URL
  const handleVideoUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, videoUrl: url }));
    
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      setFormData(prev => ({ ...prev, thumbnailUrl }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Video title is required');
      return;
    }

    if (!formData.videoUrl.trim()) {
      toast.error('Video URL is required');
      return;
    }

    // Validate YouTube URL
    if (!getYouTubeVideoId(formData.videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success('Featured video updated successfully!');
    } catch (error) {
      toast.error('Failed to update featured video');
    }
  };

  if (!isOpen) return null;

  const videoId = getYouTubeVideoId(formData.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaVideo className="mr-3 text-[#B8A692]" />
              Change Featured Video
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1 flex items-center">
                <FaYoutube className="mr-2 text-red-600" />
                YouTube Video URL *
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Paste the full YouTube video URL</p>
            </div>

            {/* Video Preview */}
            {videoId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-[#383B26]">Video Preview</label>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    {isPreviewMode ? 'Show Thumbnail' : 'Show Video'}
                  </button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  {isPreviewMode ? (
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={formData.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-video-thumbnail.png';
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Video Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Enter video title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="e.g., 15:30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Video Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Brief description of the video content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Published Date</label>
              <input
                type="date"
                value={formData.publishedAt}
                onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-[#B8A692] focus:ring-[#B8A692] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#383B26]">Set as Featured Video</span>
                    <p className="text-xs text-gray-500">This video will appear in the hero section of the healing page</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
            >
              <FaSave className="mr-2" />
              Update Featured Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealingFeaturedVideoModal;