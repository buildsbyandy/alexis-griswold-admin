import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo } from 'react-icons/fa';
import type { HealingVideo, HealingCarouselType } from '../../lib/services/healingService';
import toast from 'react-hot-toast';

interface HealingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video?: HealingVideo | null;
  onSave: (video: Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const HealingVideoModal: React.FC<HealingVideoModalProps> = ({ isOpen, onClose, video, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    duration: '',
    views: '',
    carousel: 'part1' as HealingCarouselType,
    order: 0,
    isActive: true
  });

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        youtubeUrl: video.youtubeUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        carousel: video.carousel,
        order: video.order,
        isActive: video.isActive
      });
    } else {
      // Reset form for new video
      setFormData({
        title: '',
        description: '',
        youtubeUrl: '',
        thumbnailUrl: '',
        duration: '',
        views: '',
        carousel: 'part1',
        order: 0,
        isActive: true
      });
    }
  }, [video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Video title is required');
      return;
    }

    if (!formData.youtubeUrl.trim()) {
      toast.error('YouTube URL is required');
      return;
    }

    // Validate YouTube URL format
    const youTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w\-]{11}/;
    if (!youTubeRegex.test(formData.youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success(`Video ${video ? 'updated' : 'created'} successfully!`);
    } catch (error) {
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
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Enter video title..."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-[#8F907E] mt-1">Paste any YouTube video URL. Thumbnail will be auto-generated.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Carousel *</label>
                <select
                  value={formData.carousel}
                  onChange={(e) => setFormData(prev => ({ ...prev, carousel: e.target.value as HealingCarouselType }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                >
                  <option value="part1">Gut Healing Part 1: Candida Cleanse</option>
                  <option value="part2">Gut Healing Part 2: Rebuild & Repair</option>
                </select>
                <p className="text-xs text-[#8F907E] mt-1">Choose which carousel this video belongs to.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="e.g. 12:45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Views</label>
                <input
                  type="text"
                  value={formData.views}
                  onChange={(e) => setFormData(prev => ({ ...prev, views: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="e.g. 2.4K"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#383B26]">
                  Show on website
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Enter video description..."
              />
            </div>

            {/* Optional custom thumbnail */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Custom Thumbnail URL</label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Leave blank to use YouTube thumbnail automatically"
              />
              <p className="text-xs text-[#8F907E] mt-1">Optional: Override the auto-generated YouTube thumbnail</p>
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