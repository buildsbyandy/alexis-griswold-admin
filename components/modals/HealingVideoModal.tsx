import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo, FaSpinner, FaYoutube } from 'react-icons/fa';
import Image from 'next/image';
import type { HealingVideo, HealingCarouselType } from '../../lib/services/healingService';
import { healingService } from '../../lib/services/healingService';
import toast from 'react-hot-toast';

export type CarouselContext = 'part1' | 'part2' | 'tiktoks' | 'featured';

interface HealingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video?: HealingVideo | null;
  onSave: (video: any) => Promise<void>; // Updated to handle unified data structure
  carouselContext?: CarouselContext; // Replaces carouselNumber
}

const HealingVideoModal: React.FC<HealingVideoModalProps> = ({
  isOpen,
  onClose,
  video,
  onSave,
  carouselContext = 'part1'
}) => {
  const [formData, setFormData] = useState({
    youtube_url: '',
    caption: '',
    video_description: '',
    order_index: 1,
  });

  const [isLoadingYouTubeData, setIsLoadingYouTubeData] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [thumbnail_url, setThumbnail_url] = useState('');

  useEffect(() => {
    if (video) {
      const url = video.youtube_url || '';
      setFormData({
        youtube_url: url,
        caption: video.video_title || '',
        video_description: video.video_description || '',
        order_index: video.order_index || 1,
      });

      // Set thumbnail
      const videoId = extractYouTubeId(url);
      if (videoId) {
        setThumbnail_url(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      }
    } else {
      // Reset form for new video
      setFormData({
        youtube_url: '',
        caption: '',
        video_description: '',
        order_index: 1,
      });
      setThumbnail_url('');
    }
  }, [video]);

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string => {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  // Handle YouTube URL change and auto-generate thumbnail
  const handleYouTubeUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, youtube_url: url }));

    const videoId = extractYouTubeId(url);
    if (videoId) {
      setThumbnail_url(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setThumbnail_url('');
    }
  };

  // Manual fetch YouTube metadata
  const fetchYouTubeMetadata = async () => {
    const url = formData.youtube_url;
    if (!url) {
      toast.error('Please enter a YouTube URL first');
      return;
    }

    // Check if URL is a valid YouTube URL
    const isYouTubeUrl = url && (url.includes('youtube.com') || url.includes('youtu.be'));
    if (!isYouTubeUrl) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsLoadingYouTubeData(true);
    try {
      const response = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const data = result.data;
        setFormData(prev => ({
          ...prev,
          caption: data.title || prev.caption,
          video_description: data.description || prev.video_description,
        }));
        toast.success('YouTube data loaded successfully!');
      } else {
        console.error('YouTube API error:', result.error);
        // Show more specific error messages
        if (result.error?.includes('API key not configured')) {
          toast.error('YouTube API key not configured. Please contact administrator.');
        } else if (result.error?.includes('API error')) {
          toast.error('YouTube API error. Please try again or fill in manually.');
        } else if (result.error?.includes('Video not found')) {
          toast.error('Video not found. Please check the URL or fill in manually.');
        } else if (result.error?.includes('Invalid YouTube video ID')) {
          toast.error('Invalid YouTube URL. Please check the format or fill in manually.');
        } else {
          toast.error(`YouTube error: ${result.error || 'Unknown error'}. Please fill in manually.`);
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      toast.error('Network error fetching YouTube data. Please fill in manually.');
    } finally {
      setIsLoadingYouTubeData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.caption.trim()) {
      toast.error('Video title is required');
      return;
    }

    if (!formData.youtube_url.trim()) {
      toast.error('YouTube URL is required');
      return;
    }

    // Validate YouTube URL format
    const youTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
    if (!youTubeRegex.test(formData.youtube_url)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      // Create unified video data for the new carousel system
      const videoData = {
        type: 'video' as const,
        data: {
          youtube_url: formData.youtube_url,
          caption: formData.caption,
          video_description: formData.video_description,
          order_index: formData.order_index,
          carouselContext
        }
      };

      await onSave(videoData);
      onClose();
      toast.success(`Video ${video ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error(`Failed to ${video ? 'update' : 'create'} video`);
    }
  };

  if (!isOpen) return null;

  const videoId = extractYouTubeId(formData.youtube_url);

  // Get modal title based on context
  const getModalTitle = () => {
    switch (carouselContext) {
      case 'featured':
        return video ? 'Edit Featured Video' : 'Add Featured Video';
      case 'part1':
      case 'part2':
      default:
        return video ? 'Edit Healing Video' : 'Add New Healing Video';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaVideo className="mr-3 text-[#B8A692]" />
              {getModalTitle()}
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
            {/* YouTube URL */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1 flex items-center">
                <FaYoutube className="mr-2 text-red-600" />
                YouTube Video URL *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchYouTubeMetadata}
                  disabled={isLoadingYouTubeData || !formData.youtube_url}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingYouTubeData ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaVideo />
                  )}
                  {isLoadingYouTubeData ? 'Loading...' : 'Fetch Data'}
                </button>
              </div>
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
                    <Image
                      src={thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-auto"
                      width={480}
                      height={360}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title *</label>
                <input
                  type="text"
                  value={formData.caption}
                  onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Enter video title"
                  required
                />
                <p className="mt-1 text-xs text-gray-600">Clear, descriptive title for this healing video</p>
              </div>

              {/* Show carousel context info (read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Target Location</label>
                <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  {carouselContext === 'featured' && 'Featured Video (Hero Section)'}
                  {carouselContext === 'part1' && 'Gut Healing Part 1: Candida Cleanse'}
                  {carouselContext === 'part2' && 'Gut Healing Part 2: Rebuild & Repair'}
                </div>
                <p className="text-xs text-[#8F907E] mt-1">This video will be added to the selected location.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  min="1"
                  max="5"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-600">Order in the carousel (1-5)</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                <textarea
                  value={formData.video_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Brief description of what this healing video covers..."
                />
                <p className="mt-1 text-xs text-gray-600">1-2 sentences about the video content and what viewers will learn</p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 space-x-3 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
            >
              <FaSave className="mr-2" />
              {video ? 'Update Video' : 'Create Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealingVideoModal;