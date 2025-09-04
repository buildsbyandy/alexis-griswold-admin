import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo } from 'react-icons/fa';
import type { VlogVideo } from '../../lib/services/vlogService';
import FileUpload from '../ui/FileUpload';
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
    thumbnailUrl: '',
    publishedAt: '',
    views: '',
    duration: '',
    isFeatured: false,
    order: 0,
  });

  useEffect(() => {
    if (vlog) {
      setFormData({
        title: vlog.title,
        description: vlog.description,
        thumbnailUrl: vlog.thumbnailUrl,
        publishedAt: vlog.publishedAt,
        views: vlog.views,
        duration: vlog.duration,
        isFeatured: vlog.isFeatured,
        order: vlog.order,
      });
    } else {
      // Reset form for new vlog
      setFormData({
        title: '',
        description: '',
        thumbnailUrl: '',
        publishedAt: new Date().toISOString().split('T')[0], // Default to today
        views: '0',
        duration: '',
        isFeatured: false,
        order: 0,
      });
    }
  }, [vlog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vlog title is required');
      return;
    }

    if (!formData.thumbnailUrl.trim()) {
      toast.error('Thumbnail image is required');
      return;
    }

    try {
      await onSave(formData);
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
                  placeholder="Enter vlog title..."
                  required
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
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Enter vlog description..."
              />
            </div>

            {/* Video Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 8:32"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Views</label>
                <input
                  type="text"
                  value={formData.views}
                  onChange={(e) => setFormData(prev => ({ ...prev, views: e.target.value }))}
                  placeholder="e.g., 12.5K"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Thumbnail Image *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.thumbnailUrl ? (
                  <div className="relative">
                    <img src={formData.thumbnailUrl} alt="Vlog thumbnail" className="w-full h-48 object-cover rounded" />
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