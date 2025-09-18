import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo } from 'react-icons/fa';
import type { VlogVideo, VlogCarouselType } from '../../lib/services/vlogService';
import { vlogService } from '../../lib/services/vlogService';
import FileUpload from '../ui/FileUpload';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import toast from 'react-hot-toast';

interface VlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vlog?: VlogVideo | null;
  onSave: (vlog: Omit<VlogVideo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const VlogModal: React.FC<VlogModalProps> = ({ isOpen, onClose, vlog, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    publishedAt: '',
    carousel: 'main-channel' as VlogCarouselType,
    isFeatured: false,
    order: 0,
  });

  useEffect(() => {
    if (vlog) {
      setFormData({
        title: vlog.title,
        description: vlog.description,
        youtubeUrl: vlog.youtube_url,
        thumbnailUrl: vlog.thumbnail_url,
        publishedAt: vlog.published_at,
        carousel: vlog.carousel,
        isFeatured: vlog.is_featured,
        order: vlog.display_order,
      });
    } else {
      // Reset form for new vlog
      setFormData({
        title: '',
        description: '',
        youtubeUrl: '',
        thumbnailUrl: '',
        publishedAt: new Date().toISOString().split('T')[0], // Default to today
        carousel: 'main-channel',
        isFeatured: false,
        order: 0,
      });
    }
  }, [vlog]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vlog title is required');
      return;
    }

    if (!formData.youtubeUrl.trim()) {
      toast.error('YouTube URL is required');
      return;
    }

    // Validate URL format
    if (!formData.youtubeUrl.startsWith('https://')) {
      toast.error('YouTube URL must start with https://');
      return;
    }

    // Auto-extract YouTube thumbnail if no custom thumbnail provided
    const submitData = {
      ...formData,
      thumbnailUrl: formData.thumbnailUrl || getYouTubeThumbnail(formData.youtubeUrl),
      duration: '', // Duration will be auto-populated by YouTube API
      youtubeId: null // Will be auto-populated by YouTube API
    };

    try {
      await onSave(submitData);
      onClose();
      toast.success(`Vlog ${vlog ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${vlog ? 'update' : 'create'} vlog`);
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
              {vlog ? 'Edit Vlog' : 'Add New Vlog'}
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
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Vlog Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="e.g., Morning Routine | What I Eat in a Day"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Engaging title that describes the vlog content</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Full YouTube URL - thumbnail and video info will be auto-extracted</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Carousel *</label>
                <select
                  value={formData.carousel}
                  onChange={(e) => setFormData(prev => ({ ...prev, carousel: e.target.value as VlogCarouselType }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                >
                  <option value="main-channel">{vlogService.CAROUSELS['main-channel'].displayName}</option>
                  <option value="ag-vlogs">{vlogService.CAROUSELS['ag-vlogs'].displayName}</option>
                </select>
                <p className="text-xs text-[#8F907E] mt-1">Choose which video carousel this will appear in.</p>
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
                <p className="text-xs text-gray-600 mt-1">Lower numbers appear first (0 = most recent)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Brief description of what viewers can expect in this vlog..."
              />
              <p className="text-xs text-gray-600 mt-1">1-2 sentences summarizing the vlog content</p>
            </div>


            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Thumbnail Image (Optional)</label>
              <p className="text-xs text-gray-600 mb-3">Upload a custom thumbnail to override YouTube&apos;s auto-generated thumbnail. Leave blank to use YouTube&apos;s default.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.thumbnailUrl ? (
                  <div className="relative">
                    {(() => {
                      const parsedUrl = parseSupabaseUrl(formData.thumbnailUrl)
                      if (parsedUrl) {
                        return (
                          <SecureImage
                            bucket={parsedUrl.bucket}
                            path={parsedUrl.path}
                            alt="Vlog thumbnail"
                            width={800}
                            height={192}
                            className="w-full h-48 object-cover rounded"
                          />
                        )
                      } else {
                        return (
                          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400">Invalid thumbnail URL</span>
                          </div>
                        )
                      }
                    })()}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        onUpload={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url }))}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                      >
                        Change Thumbnail
                      </FileUpload>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaVideo className="mx-auto text-4xl text-gray-400 mb-4" />
                    <FileUpload
                      accept="image/*"
                      uploadType="image"
                      onUpload={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url }))}
                      className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                    >
                      Upload Thumbnail Image
                    </FileUpload>
                    <p className="text-sm text-gray-500 mt-2">Recommended: 1280x720 pixels</p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-[#B8A692] focus:ring-[#B8A692] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#383B26]">Featured Vlog</span>
                    <p className="text-xs text-gray-500">Display as the main featured video on the vlogs page</p>
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
              {vlog ? 'Update Vlog' : 'Create Vlog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VlogModal;