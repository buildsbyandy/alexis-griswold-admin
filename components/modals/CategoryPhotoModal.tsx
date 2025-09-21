import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaImage, FaUpload } from 'react-icons/fa';
import type { StorefrontCategoryRow } from '../../lib/types/storefront';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';
import storefrontService from '../../lib/services/storefrontService';

interface CategoryPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: StorefrontCategoryRow[];
  onUpdate: () => void;
}

const CategoryPhotoModal: React.FC<CategoryPhotoModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  onUpdate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StorefrontCategoryRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [isOpen, categories, selectedCategory]);

  const handleImageUpload = async (imageUrl: string) => {
    if (!selectedCategory) return;

    setIsUpdating(true);
    try {
      await storefrontService.update_storefront_category(selectedCategory.id, {
        category_image_path: imageUrl
      });
      
      toast.success('Category photo updated successfully!');
      onUpdate(); // Refresh the categories list
    } catch (error) {
      console.error('Error updating category photo:', error);
      toast.error('Failed to update category photo');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!selectedCategory) return;

    setIsUpdating(true);
    try {
      await storefrontService.update_storefront_category(selectedCategory.id, {
        category_image_path: undefined
      });
      
      toast.success('Category photo removed successfully!');
      onUpdate(); // Refresh the categories list
    } catch (error) {
      console.error('Error removing category photo:', error);
      toast.error('Failed to remove category photo');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
            <FaImage className="mr-3 text-[#B8A692]" />
            Update Category Photos
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
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-[#383B26] mb-2">
              Select Category
            </label>
            <select
              value={selectedCategory?.id || ''}
              onChange={(e) => {
                const category = categories.find(cat => cat.id === e.target.value);
                setSelectedCategory(category || null);
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Image Display */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">
                Current Category Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {selectedCategory.category_image_path ? (
                  <div className="relative">
                    {(() => {
                      const parsedUrl = parseSupabaseUrl(selectedCategory.category_image_path);
                      if (parsedUrl) {
                        return (
                          <SecureImage
                            bucket={parsedUrl.bucket}
                            path={parsedUrl.path}
                            alt={selectedCategory.category_name}
                            width={400}
                            height={200}
                            className="w-full h-48 object-cover rounded"
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400">Invalid image URL</span>
                          </div>
                        );
                      }
                    })()}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        folder="images/categories"
                        onUpload={handleImageUpload}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                        disabled={isUpdating}
                      >
                        Change Photo
                      </FileUpload>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaImage className="mx-auto text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No photo set for this category</p>
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        folder="images/categories"
                        onUpload={handleImageUpload}
                        className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                        disabled={isUpdating}
                      >
                        Upload Category Photo
                      </FileUpload>
                  </div>
                )}
              </div>
              
              {/* Remove button - separate from upload area */}
              {selectedCategory.category_image_path && (
                <div className="mt-3 text-center">
                  <button
                    onClick={handleRemoveImage}
                    disabled={isUpdating}
                    className="px-4 py-2 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category Info */}
          {selectedCategory && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-[#383B26] mb-2">Category Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Name:</strong> {selectedCategory.category_name}</div>
                <div><strong>Slug:</strong> {selectedCategory.slug}</div>
                {selectedCategory.category_description && (
                  <div><strong>Description:</strong> {selectedCategory.category_description}</div>
                )}
                <div><strong>Status:</strong> {selectedCategory.is_visible ? 'Visible' : 'Hidden'}</div>
                {selectedCategory.is_featured && (
                  <div><strong>Featured:</strong> Yes</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryPhotoModal;
