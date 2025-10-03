import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo, FaSpinner } from 'react-icons/fa';
import type { VlogVideo, VlogCarouselType } from '../../lib/services/vlogService';
import { vlogService } from '../../lib/services/vlogService';
import FileUpload from '../ui/FileUpload';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import toast from 'react-hot-toast';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

interface VlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vlog?: VlogVideo | null;
  onSave: (vlog: Omit<VlogVideo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  currentCarouselCount?: number; // Number of vlogs currently in the selected carousel
}

const VlogModal: React.FC<VlogModalProps> = ({ isOpen, onClose, vlog, onSave, currentCarouselCount = 0 }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnailUrl: '',
    publishedAt: '',
    carousel: 'vlogs-main-channel' as VlogCarouselType,
    order: 0,
  });
  const [isLoadingYouTubeData, setIsLoadingYouTubeData] = useState(false);

  // Helper to reset form to initial state
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      thumbnailUrl: '',
      publishedAt: new Date().toISOString().split('T')[0],
      carousel: 'vlogs-main-channel',
      order: currentCarouselCount, // Auto-increment based on current count
    });
  };

  useEffect(() => {
    if (vlog) {
      // Editing existing vlog
      setFormData({
        title: vlog.title,
        description: vlog.description,
        youtubeUrl: vlog.youtube_url,
        thumbnailUrl: vlog.thumbnail_url,
        publishedAt: vlog.published_at,
        carousel: vlog.carousel,
        order: vlog.order_index,
      });
    } else {
      // New vlog - reset form with auto-incremented order
      resetForm();
    }
  }, [vlog, isOpen, resetForm]);

  // Update order field when carousel count changes (e.g., after deletion)
  useEffect(() => {
    if (!vlog && isOpen) {
      setFormData(prev => ({
        ...prev,
        order: currentCarouselCount
      }));
    }
  }, [currentCarouselCount, vlog, isOpen]);

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

  // Handle YouTube URL change (no auto-fetch)
  const handleYouTubeUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, youtubeUrl: url }));
  };

  // Manual fetch YouTube metadata
  const fetchYouTubeMetadata = async () => {
    const url = formData.youtubeUrl;
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
          title: data.title || prev.title,
          description: data.description || prev.description,
          thumbnailUrl: data.thumbnail_url || prev.thumbnailUrl,
          publishedAt: data.published_at || prev.publishedAt,
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
      title: formData.title,
      description: formData.description,
      youtube_url: formData.youtubeUrl,
      youtube_id: null, // Will be auto-populated by YouTube API
      thumbnail_url: formData.thumbnailUrl || getYouTubeThumbnail(formData.youtubeUrl),
      published_at: formData.publishedAt,
      duration: '', // Duration will be auto-populated by YouTube API
      carousel: formData.carousel,
      order_index: formData.order,
      created_at: vlog ? vlog.created_at : new Date(),
      updated_at: new Date()
    };

    try {
      await onSave(submitData);
      toast.success(`Vlog ${vlog ? 'updated' : 'created'} successfully!`);

      // Clear form after successful save (only for new vlogs)
      if (!vlog) {
        resetForm();
      }

      onClose();
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
                <label className="block text-sm font-medium text-[#383B26] mb-1">YouTube URL *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchYouTubeMetadata}
                    disabled={isLoadingYouTubeData || !formData.youtubeUrl}
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
                <p className="text-xs text-gray-600 mt-1">
                  Paste YouTube URL and click &quot;Fetch Data&quot; to auto-fill title, description, and thumbnail
                </p>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Carousel *</label>
                <select
                  value={formData.carousel}
                  onChange={(e) => setFormData(prev => ({ ...prev, carousel: e.target.value as VlogCarouselType }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                >
                  <option value="vlogs-main-channel">{vlogService.CAROUSELS['vlogs-main-channel'].displayName}</option>
                  <option value="vlogs-ag-vlogs">{vlogService.CAROUSELS['vlogs-ag-vlogs'].displayName}</option>
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
                        folder={STORAGE_PATHS.VLOG_THUMBNAILS}
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
                    <div className="flex justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        folder={STORAGE_PATHS.VLOG_THUMBNAILS}
                        onUpload={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url }))}
                        className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                      >
                        Upload Thumbnail Image
                      </FileUpload>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Recommended: 1280x720 pixels</p>
                  </div>
                )}
              </div>
            </div>

            {/* Note: Featured vlog functionality now managed through carousel system */}
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