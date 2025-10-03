import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import toast from 'react-hot-toast';
import type { TikTokVideo } from './HealingCarouselModal';
import ImageUpload from '../admin/ImageUpload';
import { STORAGE_PATHS } from '../../lib/constants/storagePaths';

interface TikTokVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TikTokVideo & { thumbnail_url?: string }) => Promise<void>;
  video?: TikTokVideo & { id?: string; thumbnail_url?: string } | null;
}

const TikTokVideoModal: React.FC<TikTokVideoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  video
}) => {
  const [formData, setFormData] = useState({
    link_url: '',
    caption: '',
    order_index: 1,
    thumbnail_url: '',
  });

  useEffect(() => {
    if (video) {
      console.log('[TikTokVideoModal] Editing video:', video);
      setFormData({
        link_url: video.link_url || '',
        caption: video.caption || '',
        order_index: video.order_index || 1,
        thumbnail_url: video.thumbnail_url || '',
      });
    } else {
      setFormData({
        link_url: '',
        caption: '',
        order_index: 1,
        thumbnail_url: '',
      });
    }
  }, [video, isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate TikTok URL
  const validateTikTokUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    return url.includes('tiktok.com/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.link_url.trim()) {
      toast.error('TikTok URL is required');
      return;
    }

    if (!validateTikTokUrl(formData.link_url)) {
      toast.error('Please enter a valid TikTok URL (must contain tiktok.com/)');
      return;
    }

    if (formData.order_index < 1) {
      toast.error('Order index must be at least 1');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        link_url: formData.link_url.trim(),
        caption: formData.caption.trim() || undefined,
        order_index: formData.order_index,
        thumbnail_url: formData.thumbnail_url || undefined,
      });

      // Reset form
      setFormData({
        link_url: '',
        caption: '',
        order_index: 1,
        thumbnail_url: '',
      });

      onClose();
      toast.success(`TikTok video ${video ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Error saving TikTok video:', error);
      toast.error('Failed to save TikTok video');
    } finally {
      setIsSubmitting(false);
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
              <SiTiktok className="mr-3 text-[#B8A692]" />
              {video ? 'Edit TikTok Video' : 'Add TikTok Video'}
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
            {/* TikTok URL */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                TikTok URL *
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="https://www.tiktok.com/@username/video/..."
                required
              />
              <p className="text-xs text-[#8F907E] mt-1">
                Paste the full TikTok video URL
              </p>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Caption
              </label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Optional caption for this TikTok video..."
              />
              <p className="text-xs text-[#8F907E] mt-1">
                Brief description or context for this inspirational video
              </p>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Thumbnail Image
              </label>
              <ImageUpload
                value={formData.thumbnail_url ? [formData.thumbnail_url] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, thumbnail_url: urls[0] || '' }))}
                maxImages={1}
                folder={STORAGE_PATHS.RECIPE_IMAGES}
                placeholder="Upload thumbnail for TikTok video"
                showPreview={true}
              />
              <p className="text-xs text-[#8F907E] mt-1">
                Optional: Upload a custom thumbnail image for this TikTok video
              </p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Display Order *
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  order_index: parseInt(e.target.value) || 1
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                min="1"
                max="20"
                required
              />
              <p className="text-xs text-[#8F907E] mt-1">
                Order in which this video should appear in the carousel
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <SiTiktok className="w-5 h-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">TikTok Integration</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>TikTok videos will be embedded directly on the healing page to inspire and motivate visitors on their wellness journey.</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Videos appear in the dedicated TikTok Inspirations carousel</li>
                      <li>Only TikTok URLs from tiktok.com are accepted</li>
                      <li>Videos are ordered by the display order you specify</li>
                    </ul>
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
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Saving...' : (video ? 'Update TikTok Video' : 'Add TikTok Video')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TikTokVideoModal;