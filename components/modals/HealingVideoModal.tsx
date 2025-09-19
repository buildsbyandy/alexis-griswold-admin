import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo } from 'react-icons/fa';
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
  });

  const [carouselNumber, setCarouselNumber] = useState(1);

  useEffect(() => {
    if (video) {
      setFormData({
        youtube_url: video.youtube_url || '',
        video_title: video.video_title || '',
        video_description: video.video_description || '',
        video_order: video.video_order || 1,
      });
    } else {
      // Reset form for new video
      setFormData({
        youtube_url: '',
        video_title: '',
        video_description: '',
        video_order: 1,
      });
    }

    if (propCarouselNumber) {
      setCarouselNumber(propCarouselNumber);
    }
  }, [video, propCarouselNumber]);

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
          type: carouselNumber === 1 ? 'part1' : 'part2'
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
          video_order: formData.video_order
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-xs text-gray-600 mt-1">Clear, descriptive title for this healing video</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-[#8F907E] mt-1">Paste any YouTube video URL. Thumbnail will be auto-generated.</p>
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
                <p className="text-xs text-gray-600 mt-1">Order in the carousel (1-5)</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
                <textarea
                  value={formData.video_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Brief description of what this healing video covers..."
                />
                <p className="text-xs text-gray-600 mt-1">1-2 sentences about the video content and what viewers will learn</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
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