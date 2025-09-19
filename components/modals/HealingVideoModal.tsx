import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo, FaSpinner } from 'react-icons/fa';
import type { HealingVideo, HealingCarouselType } from '../../lib/services/healingService';
import { healingService } from '../../lib/services/healingService';
import toast from 'react-hot-toast';

interface HealingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video?: HealingVideo | null;
  onSave: (video: HealingVideo) => Promise<void>;
  carouselNumber?: number;
}

const HealingVideoModal: React.FC<HealingVideoModalProps> = ({
  isOpen,
  onClose,
  video,
  onSave,
  carouselNumber: propCarouselNumber
}) => {
  const [formData, setFormData] = useState({
    youtube_url: '',
    video_title: '',
    video_description: '',
    video_order: 1,
    is_featured: false,
  });

  const [carouselNumber, setCarouselNumber] = useState(1);
  const [isLoadingYouTubeData, setIsLoadingYouTubeData] = useState(false);

  useEffect(() => {
    if (video) {
      setFormData({
        youtube_url: video.youtube_url || '',
        video_title: video.video_title || '',
        video_description: video.video_description || '',
        video_order: video.video_order || 1,
        is_featured: video.is_featured || false,
      });
    } else {
      // Reset form for new video
      setFormData({
        youtube_url: '',
        video_title: '',
        video_description: '',
        video_order: 1,
        is_featured: false,
      });
    }

    if (propCarouselNumber) {
      setCarouselNumber(propCarouselNumber);
    }
  }, [video, propCarouselNumber]);

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

  // Auto-fetch YouTube metadata when URL is entered
  const handleYouTubeUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, youtube_url: url }));
    
    // Only auto-fetch if this is a new video (not editing existing)
    if (!video && url && url.includes('youtube.com')) {
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
            video_title: data.title || prev.video_title,
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.video_title.trim()) {
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
      if (video?.id) {
        // Update existing video
        const response = await healingService.updateVideo(video.id, {
          youtube_url: formData.youtube_url,
          video_order: formData.video_order,
          type: carouselNumber === 1 ? 'part1' : 'part2',
          is_featured: formData.is_featured
        });
        if (response.error) {
          throw new Error(response.error);
        }
        if (!response.data) {
          throw new Error('Update failed');
        }
        // For updates, we don't call onSave since updateVideo only returns a boolean
        // The parent component should handle refreshing the data
      } else {
        // Create new video
        const response = await healingService.createVideo({
          type: carouselNumber === 1 ? 'part1' : 'part2',
          youtube_url: formData.youtube_url,
          video_title: formData.video_title,
          video_description: formData.video_description,
          video_order: formData.video_order,
          is_featured: formData.is_featured
        });
        if (response.error) {
          throw new Error(response.error);
        }
        if (!response.data) {
          throw new Error('No data returned from create');
        }
        await onSave(response.data);
      }
      onClose();
      toast.success(`Video ${video ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error(`Failed to ${video ? 'update' : 'create'} video`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaVideo className="mr-3 text-[#B8A692]" />
              {video ? 'Edit Healing Video' : 'Add New Healing Video'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692] pr-10"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  {isLoadingYouTubeData && (
                    <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                      <FaSpinner className="animate-spin text-[#B8A692]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#8F907E] mt-1">Paste any YouTube video URL. Title and description will be auto-filled.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Video Title *</label>
                <input
                  type="text"
                  value={formData.video_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="e.g., Day 1: Starting Your Candida Cleanse Journey"
                  required
                />
                <p className="mt-1 text-xs text-gray-600">Clear, descriptive title for this healing video</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Carousel *</label>
                <select
                  value={carouselNumber}
                  onChange={(e) => setCarouselNumber(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                >
                  <option value={1}>Gut Healing Part 1: Candida Cleanse</option>
                  <option value={2}>Gut Healing Part 2: Rebuild & Repair</option>
                </select>
                <p className="text-xs text-[#8F907E] mt-1">Choose which carousel this video belongs to.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.video_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_order: parseInt(e.target.value) || 1 }))}
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

            {/* Featured Video Settings */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-[#B8A692] focus:ring-[#B8A692] border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#383B26]">Featured Video</span>
                      <p className="text-xs text-gray-500">Display as the main featured video on the healing page</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-3 border border-blue-200 rounded-md bg-blue-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Featured Video Behavior</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>Featured videos are displayed separately from carousel videos to avoid duplication. When a video is marked as featured:</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>It appears as the main hero video on the healing page</li>
                        <li>It will NOT appear in the carousel below</li>
                        <li>Only one video can be featured at a time</li>
                      </ul>
                    </div>
                  </div>
                </div>
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