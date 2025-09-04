import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaStore, FaPlus, FaTrash } from 'react-icons/fa';
import type { StorefrontProduct } from '../../lib/services/storefrontService';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';

interface StorefrontProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: StorefrontProduct | null;
  onSave: (product: Omit<StorefrontProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const StorefrontProductModal: React.FC<StorefrontProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'food' as 'food' | 'healing' | 'home' | 'personal-care',
    amazonUrl: '',
    image: '',
    imageUrl: '',
    imageAlt: '',
    noteShort: '',
    noteLong: '',
    description: '',
    price: undefined as number | undefined,
    tags: [] as string[],
    isAlexisPick: false,
    isFavorite: false,
    showInFavorites: false,
    status: 'draft' as 'draft' | 'published' | 'archived',
    sortWeight: 0,
    usedIn: [] as { type: 'recipe' | 'video'; slug: string; title?: string }[],
    pairsWith: [] as string[],
    clicks30d: 0,
  });

  const [newTag, setNewTag] = useState('');
  const [newPairsWith, setNewPairsWith] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        slug: product.slug,
        category: product.category,
        amazonUrl: product.amazonUrl,
        image: product.image,
        imageUrl: product.imageUrl || '',
        imageAlt: product.imageAlt,
        noteShort: product.noteShort,
        noteLong: product.noteLong || '',
        description: product.description || '',
        price: product.price,
        tags: product.tags,
        isAlexisPick: product.isAlexisPick,
        isFavorite: product.isFavorite || false,
        showInFavorites: product.showInFavorites,
        status: product.status,
        sortWeight: product.sortWeight,
        usedIn: product.usedIn,
        pairsWith: product.pairsWith,
        clicks30d: product.clicks30d || 0,
      });
    } else {
      // Reset form for new product
      setFormData({
        title: '',
        slug: '',
        category: 'food',
        amazonUrl: '',
        image: '',
        imageUrl: '',
        imageAlt: '',
        noteShort: '',
        noteLong: '',
        description: '',
        price: undefined,
        tags: [],
        isAlexisPick: false,
        isFavorite: false,
        showInFavorites: false,
        status: 'draft',
        sortWeight: 0,
        usedIn: [],
        pairsWith: [],
        clicks30d: 0,
      });
    }
  }, [product]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      imageAlt: title ? `${title} product image` : ''
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPairsWith = () => {
    if (newPairsWith.trim() && !formData.pairsWith.includes(newPairsWith.trim())) {
      setFormData(prev => ({
        ...prev,
        pairsWith: [...prev.pairsWith, newPairsWith.trim()]
      }));
      setNewPairsWith('');
    }
  };

  const removePairsWith = (itemToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      pairsWith: prev.pairsWith.filter(item => item !== itemToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Product title is required');
      return;
    }

    if (!formData.amazonUrl.trim()) {
      toast.error('Amazon URL is required');
      return;
    }

    if (!formData.noteShort.trim()) {
      toast.error('Short note is required');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success(`Product ${product ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${product ? 'update' : 'create'} product`);
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
                  value={formData.title}
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
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="food">Food</option>
                  <option value="healing">Healing</option>
                  <option value="home">Home</option>
                  <option value="personal-care">Personal Care</option>
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
                  value={formData.amazonUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, amazonUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {(formData.imageUrl || formData.image) ? (
                  <div className="relative">
                    <img src={formData.imageUrl || formData.image} alt="Product" className="w-full h-48 object-cover rounded" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        onUpload={(url) => setFormData(prev => ({ ...prev, imageUrl: url, image: url }))}
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
                      onUpload={(url) => setFormData(prev => ({ ...prev, imageUrl: url, image: url }))}
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
                value={formData.noteShort}
                onChange={(e) => setFormData(prev => ({ ...prev, noteShort: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Brief description shown in product cards"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Long Note</label>
              <textarea
                value={formData.noteLong}
                onChange={(e) => setFormData(prev => ({ ...prev, noteLong: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Detailed description"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
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
                <span className="text-sm text-[#383B26]">Alexis' Pick</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFavorite: e.target.checked }))}
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