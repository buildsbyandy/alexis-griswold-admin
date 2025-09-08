import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaSave, FaStore, FaPlus, FaTrash } from 'react-icons/fa';
import type { StorefrontProduct as ServiceStorefrontProduct } from '../../lib/services/storefrontService';
import type { StorefrontProductFormInput, StorefrontProductFormData, StorefrontCategoryOption } from '../../lib/types/storefront';
import { StorefrontProductFormSchema } from '../../lib/types/storefront';
import { slugify, parsePrice } from '../../lib/utils/storefront';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';

interface StorefrontProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ServiceStorefrontProduct | null;
  onSave: (product: StorefrontProductFormData) => Promise<void>;
  categories?: StorefrontCategoryOption[];
}

const StorefrontProductModal: React.FC<StorefrontProductModalProps> = ({ isOpen, onClose, product, onSave, categories = [] }) => {
  const [formData, setFormData] = useState<StorefrontProductFormInput>({
    product_title: '',
    slug: '',
    category_name: 'Food',
    amazon_url: '',
    price: '',
    product_image_path: '',
    noteShort: '',
    noteLong: '',
    tags: [],
    isAlexisPick: false,
    is_favorite: false,
    showInFavorites: false,
    status: 'draft',
    sortWeight: 0,
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (product) {
      // Map from service StorefrontProduct to form input
      setFormData({
        product_title: product.title,
        slug: product.slug,
        category_name: product.category === 'food' ? 'Food' : 
                      product.category === 'healing' ? 'Healing' : 
                      product.category === 'home' ? 'Home' : 'Personal Care',
        amazon_url: product.amazonUrl,
        price: product.price?.toString() || '',
        product_image_path: product.image,
        noteShort: product.noteShort || '',
        noteLong: product.noteLong || '',
        tags: product.tags || [],
        isAlexisPick: product.isAlexisPick,
        is_favorite: product.isFavorite || false,
        showInFavorites: product.showInFavorites,
        status: product.status,
        sortWeight: product.sortWeight,
      });
    } else {
      // Reset form for new product
      setFormData({
        product_title: '',
        slug: '',
        category_name: 'Food',
        amazon_url: '',
        price: '',
        product_image_path: '',
        noteShort: '',
        noteLong: '',
        tags: [],
        isAlexisPick: false,
        is_favorite: false,
        showInFavorites: false,
        status: 'draft',
        sortWeight: 0,
      });
    }
  }, [product]);

  // Use the utility function for slug generation

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      product_title: title,
      slug: prev.slug || slugify(title), // Only auto-generate if slug is empty
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate slug if empty
      const finalFormData = {
        ...formData,
        slug: formData.slug || slugify(formData.product_title),
      };
      
      // Validate with Zod schema
      const validatedData = StorefrontProductFormSchema.parse(finalFormData);
      
      await onSave(validatedData);
      onClose();
      toast.success(`Product ${product ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(`Failed to ${product ? 'update' : 'create'} product`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaStore className="mr-3 text-[#B8A692]" />
              {product ? 'Edit Product' : 'Add New Product'}
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
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Product Title *</label>
                <input
                  type="text"
                  value={formData.product_title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Category *</label>
                <select
                  value={formData.category_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.category_name} value={cat.category_name}>
                        {cat.category_name}
                      </option>
                    ))
                  ) : (
                    // Fallback to hardcoded options if categories not loaded
                    <>
                      <option value="Food">Food</option>
                      <option value="Healing">Healing</option>
                      <option value="Home">Home</option>
                      <option value="Personal Care">Personal Care</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Sort Weight</label>
                <input
                  type="number"
                  value={formData.sortWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortWeight: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Amazon URL & Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Amazon URL *</label>
                <input
                  type="url"
                  value={formData.amazon_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, amazon_url: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="https://www.amazon.com/product-name/dp/..."
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Must start with https:// (e.g., https://www.amazon.com/...)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.product_image_path ? (
                  <div className="relative">
                    <Image src={formData.product_image_path} alt="Product" width={800} height={192} className="w-full h-48 object-cover rounded" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        onUpload={(url) => setFormData(prev => ({ ...prev, product_image_path: url }))}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                      >
                        Change Image
                      </FileUpload>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaStore className="mx-auto text-4xl text-gray-400 mb-4" />
                    <FileUpload
                      accept="image/*"
                      uploadType="image"
                      onUpload={(url) => setFormData(prev => ({ ...prev, product_image_path: url }))}
                      className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                    >
                      Upload Product Image
                    </FileUpload>
                  </div>
                )}
              </div>
            </div>

            {/* Product Notes */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Short Note *</label>
              <input
                type="text"
                value={formData.noteShort || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, noteShort: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Brief description shown in product cards"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Long Note</label>
              <textarea
                value={formData.noteLong || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, noteLong: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Detailed description"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(formData.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#E3D4C2] text-[#383B26] rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Product Settings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isAlexisPick}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAlexisPick: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Alexis&apos; Pick</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_favorite}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_favorite: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Favorite</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.showInFavorites}
                  onChange={(e) => setFormData(prev => ({ ...prev, showInFavorites: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Show in Favorites</span>
              </label>
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
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorefrontProductModal;