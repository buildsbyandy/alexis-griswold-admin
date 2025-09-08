import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaSave, FaImage, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import type { PhotoAlbum, Photo } from '../../lib/services/vlogService';
import ImageUpload from '../admin/ImageUpload';
import toast from 'react-hot-toast';

interface PhotoAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  album?: PhotoAlbum | null;
  onSave: (album: Omit<PhotoAlbum, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const PhotoAlbumModal: React.FC<PhotoAlbumModalProps> = ({ isOpen, onClose, album, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    category: 'Lifestyle' as 'Lifestyle' | 'Food' | 'Travel' | 'Wellness' | 'Fitness' | 'Home',
    date: '',
    isFeatured: false,
    order: 0,
    photos: [] as Photo[]
  });

  const [newPhoto, setNewPhoto] = useState({
    src: '',
    alt: '',
    caption: ''
  });

  const [showAddPhoto, setShowAddPhoto] = useState(false);

  useEffect(() => {
    if (album) {
      setFormData({
        title: album.title,
        description: album.description,
        coverImage: album.coverImage,
        category: album.category,
        date: album.date,
        isFeatured: album.isFeatured,
        order: album.order,
        photos: album.photos || []
      });
    } else {
      // Reset form for new album
      setFormData({
        title: '',
        description: '',
        coverImage: '',
        category: 'Lifestyle',
        date: new Date().toISOString().split('T')[0],
        isFeatured: false,
        order: 0,
        photos: []
      });
    }
  }, [album]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Album title is required');
      return;
    }

    if (!formData.coverImage.trim()) {
      toast.error('Cover image is required');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success(`Album ${album ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${album ? 'update' : 'create'} album`);
    }
  };

  const handleAddPhoto = () => {
    if (!newPhoto.src.trim() || !newPhoto.alt.trim()) {
      toast.error('Photo image and alt text are required');
      return;
    }

    const photo: Photo = {
      id: Date.now().toString(),
      src: newPhoto.src,
      alt: newPhoto.alt,
      caption: newPhoto.caption,
      order: formData.photos.length + 1
    };

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photo]
    }));

    setNewPhoto({ src: '', alt: '', caption: '' });
    setShowAddPhoto(false);
  };

  const handleRemovePhoto = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
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
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Album Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="Enter album title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                >
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Home">Home</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Album Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="featured" className="text-sm font-medium text-[#383B26]">
                  Featured Album
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Enter album description..."
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Cover Image *</label>
              <ImageUpload
                value={formData.coverImage ? [formData.coverImage] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, coverImage: urls[0] || '' }))}
                maxImages={1}
                folder="albums"
                placeholder="Upload cover image"
                showPreview={true}
              />
            </div>

            {/* Photos Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#383B26]">Photos ({formData.photos.length})</h3>
                <button
                  type="button"
                  onClick={() => setShowAddPhoto(true)}
                  className="px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-1" />
                  Add Photo
                </button>
              </div>

              {/* Photo List */}
              {formData.photos.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.photos.map((photo) => (
                    <div key={photo.id} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{photo.alt}</p>
                        {photo.caption && <p className="text-xs text-gray-600">{photo.caption}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-md">
                  <FaImage className="mx-auto text-3xl mb-2 opacity-50" />
                  <p>No photos added yet</p>
                </div>
              )}

              {/* Add Photo Form */}
              {showAddPhoto && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h4 className="font-medium text-[#383B26] mb-3">Add New Photo</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Photo Image</label>
                      <ImageUpload
                        value={newPhoto.src ? [newPhoto.src] : []}
                        onChange={(urls) => setNewPhoto(prev => ({ ...prev, src: urls[0] || '' }))}
                        maxImages={1}
                        folder="albums"
                        placeholder="Upload photo image"
                        showPreview={true}
                      />
                    </div>
                    <input
                      type="text"
                      value={newPhoto.alt}
                      onChange={(e) => setNewPhoto(prev => ({ ...prev, alt: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      placeholder="Alt text (required)..."
                    />
                    <input
                      type="text"
                      value={newPhoto.caption}
                      onChange={(e) => setNewPhoto(prev => ({ ...prev, caption: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                      placeholder="Caption (optional)..."
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPhoto(false)}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              {album ? 'Update Album' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoAlbumModal;