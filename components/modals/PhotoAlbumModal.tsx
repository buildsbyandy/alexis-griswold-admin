import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaImage } from 'react-icons/fa';
import type { PhotoAlbum } from '../../lib/services/albumService';
import ImageUpload from '../admin/ImageUpload';
import toast from 'react-hot-toast';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

interface PhotoAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  album?: PhotoAlbum | null;
  onSave: (album: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'> & { photos?: Array<{ photo_url: string; photo_order: number; caption: string | null }> }, carouselId: string, orderIndex?: number) => Promise<void>;
  forcePageType?: string;
  carouselId: string;
}

const PhotoAlbumModal: React.FC<PhotoAlbumModalProps> = ({ isOpen, onClose, album, onSave, forcePageType, carouselId }) => {
  const [formData, setFormData] = useState({
    album_title: '',
    album_description: '',
    cover_image_path: '',
    additional_images: [] as string[],
    album_date: '',
    is_visible: false,
    album_order: 1
  });

  useEffect(() => {
    if (album) {
      setFormData({
        album_title: album.album_title,
        album_description: album.album_description || '',
        cover_image_path: album.cover_image_path || '',
        additional_images: [],
        album_date: album.album_date || '',
        is_visible: album.is_visible || false,
        album_order: album.album_order || 1
      });
    } else {
      setFormData({
        album_title: '',
        album_description: '',
        cover_image_path: '',
        additional_images: [],
        album_date: new Date().toISOString().split('T')[0],
        is_visible: false,
        album_order: 1
      });
    }
  }, [album]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.album_title.trim()) {
      toast.error('Album title is required');
      return;
    }

    if (!formData.cover_image_path.trim()) {
      toast.error('Cover image is required');
      return;
    }

    try {
      // Build photos array from additional images
      const photos = formData.additional_images.map((url, index) => ({
        photo_url: url,
        photo_order: index + 1,
        caption: null
      }));

      const albumData = {
        album_title: formData.album_title,
        album_description: formData.album_description || null,
        page_type: forcePageType || null,
        cover_image_path: formData.cover_image_path,
        album_date: formData.album_date || null,
        album_order: formData.album_order,
        is_visible: formData.is_visible,
        photos: photos.length > 0 ? photos : undefined
      };
      
      console.log('Submitting album data:', albumData);
      
      await onSave(albumData as any, carouselId, formData.album_order);
      onClose();
      toast.success(`Album ${album ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving album:', error);
      toast.error(`Failed to ${album ? 'update' : 'create'} album`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaImage className="mr-3 text-[#B8A692]" />
              {album ? 'Edit Photo Album' : 'Add New Photo Album'}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Album Title *</label>
                <input
                  type="text"
                  value={formData.album_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, album_title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Enter album title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Album Date</label>
                <input
                  type="date"
                  value={formData.album_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, album_date: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Display Order (1-6)</label>
                <input
                  type="number"
                  value={formData.album_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, album_order: parseInt(e.target.value) || 1 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  min="1"
                  max="6"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="visible" className="text-sm font-medium text-[#383B26]">
                  Visible on Site
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.album_description}
                onChange={(e) => setFormData(prev => ({ ...prev, album_description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Enter album description..."
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Cover Image *</label>
              <p className="mb-2 text-xs text-gray-600">Main image that represents the album</p>
              <ImageUpload
                value={formData.cover_image_path ? [formData.cover_image_path] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, cover_image_path: urls[0] || '' }))}
                maxImages={1}
                folder={STORAGE_PATHS.VLOG_ALBUM_IMAGES}
                placeholder="Upload cover image"
                showPreview={true}
              />
            </div>

            {/* Additional Album Photos */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Additional Photos (Optional)</label>
              <p className="mb-2 text-xs text-gray-600">Upload additional photos for this album (up to 20)</p>
              <ImageUpload
                value={formData.additional_images}
                onChange={(urls) => {
                  console.log('Additional images updated:', urls);
                  setFormData(prev => ({ ...prev, additional_images: urls }));
                }}
                maxImages={20}
                folder={STORAGE_PATHS.VLOG_ALBUM_IMAGES}
                placeholder="Upload additional album photos"
                showPreview={true}
              />
            </div>
          </div>

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
              {album ? 'Update Album' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoAlbumModal;