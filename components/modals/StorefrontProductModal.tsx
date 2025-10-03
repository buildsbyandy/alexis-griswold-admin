import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaStore, FaPlus, FaTrash } from 'react-icons/fa';
import type { StorefrontProductRow, StorefrontProductFormData, StorefrontCategoryRow } from '../../lib/types/storefront';
import { slugify, parsePrice } from '../../lib/utils/storefront';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

interface StorefrontProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: StorefrontProductRow | null;
  onSave: (product: StorefrontProductFormData) => Promise<void>;
  categories?: StorefrontCategoryRow[];
}

const StorefrontProductModal: React.FC<StorefrontProductModalProps> = ({ isOpen, onClose, product, onSave, categories = [] }) => {
  const [formData, setFormData] = useState<StorefrontProductFormData>({
    product_title: '',
    slug: '',
    category_slug: '',
    amazon_url: '',
    price: 0,
    image_path: '',
    description: '',
    tags: [],
    is_alexis_pick: false,
    // Legacy is_favorite field removed - featured status managed by carousel system
    status: 'draft',
  });

  const [newTag, setNewTag] = useState('');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Map from StorefrontProductRow to form data
        setFormData({
          product_title: product.product_title || '',
          slug: product.slug || '',
          category_slug: product.category_slug || '',
          amazon_url: product.amazon_url || '',
          price: product.price || 0,
          image_path: product.image_path || '',
          description: product.description || '',
          tags: product.tags || [],
          is_alexis_pick: false, // Will be loaded from carousel system
          // Legacy is_favorite field removed - featured status managed by carousel system
          status: product.status || 'draft',
        });
      } else {
        // Reset form for new product
        setFormData({
          product_title: '',
          slug: '',
          category_slug: '',
          amazon_url: '',
          price: 0,
          image_path: '',
          description: '',
          tags: [],
          is_alexis_pick: false,
          // Legacy is_favorite field removed - featured status managed by carousel system
          status: 'draft',
        });
      }
    }
  }, [product, isOpen]);

  // Use the utility function for slug generation

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      product_title: title,
      slug: slugify(title), // Always auto-generate slug from title
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

  const addBatchTags = (input: string) => {
    // Split by comma or space, filter empties, dedupe
    const newTags = input
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag && !(formData.tags || []).includes(tag));

    if (newTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), ...newTags]
      }));
    }
    setNewTag('');
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
      // Generate base slug if empty
      let finalSlug = formData.slug || slugify(formData.product_title);

      // Check for duplicate slugs
      const response = await fetch('/api/storefront');
      if (response.ok) {
        const { products } = await response.json();

        // Filter out current product when editing
        const otherProducts = product
          ? products.filter((p: any) => p.id !== product.id)
          : products;

        // Check if slug exists
        const existingSlugs = new Set(otherProducts.map((p: any) => p.slug));

        if (existingSlugs.has(finalSlug)) {
          // Append number to make unique
          let counter = 2;
          let uniqueSlug = `${finalSlug}-${counter}`;
          while (existingSlugs.has(uniqueSlug)) {
            counter++;
            uniqueSlug = `${finalSlug}-${counter}`;
          }
          finalSlug = uniqueSlug;
          toast(`Slug was modified to "${finalSlug}" to avoid duplicates`, { icon: 'ℹ️' });
        }
      }

      const finalFormData = {
        ...formData,
        slug: finalSlug,
      };

      await onSave(finalFormData);
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
      <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
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

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* SECTION: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#383B26] uppercase tracking-wide border-b pb-2">Basic Info</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Title - Full width on mobile, half on desktop */}
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">Category *</label>
                  <select
                    value={formData.category_slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_slug: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.category_name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="food">Food</option>
                        <option value="healing">Healing</option>
                        <option value="home">Home</option>
                        <option value="personal-care">Personal Care</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Status - Compact width */}
              <div className="w-48">
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

              {/* Slug info - not editable */}
              <p className="text-xs text-gray-500">
                URL slug: <span className="font-mono text-gray-700">{formData.slug || '(auto-generated from title)'}</span>
              </p>
            </div>

            {/* SECTION: Commerce */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#383B26] uppercase tracking-wide border-b pb-2">Commerce</h3>

              {/* Amazon URL - Full width */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Amazon URL *</label>
                <input
                  type="url"
                  value={formData.amazon_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, amazon_url: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="https://www.amazon.com/product-name/dp/..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must start with https://</p>
              </div>

              {/* Price - Compact */}
              <div className="w-32">
                <label className="block text-sm font-medium text-[#383B26] mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* SECTION: Media */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#383B26] uppercase tracking-wide border-b pb-2">Media</h3>

              {/* Product Image - Fixed height box */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-2">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                  {formData.image_path ? (
                    <div className="relative w-full h-full group">
                      {(() => {
                        const parsedUrl = parseSupabaseUrl(formData.image_path)
                        if (parsedUrl) {
                          return (
                            <SecureImage
                              bucket={parsedUrl.bucket}
                              path={parsedUrl.path}
                              alt="Product"
                              width={400}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          )
                        } else {
                          return (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">Invalid image URL</span>
                            </div>
                          )
                        }
                      })()}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImagePreviewOpen(true)}
                          className="px-3 py-1.5 bg-white text-gray-800 rounded text-sm hover:bg-gray-100"
                        >
                          View Full
                        </button>
                        <FileUpload
                          accept="image/*"
                          uploadType="image"
                          folder={STORAGE_PATHS.STOREFRONT_PRODUCT_IMAGES}
                          contentStatus={formData.status}
                          onUpload={(url) => setFormData(prev => ({ ...prev, image_path: url }))}
                          className="px-3 py-1.5 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C]"
                        >
                          Change
                        </FileUpload>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                      <FaStore className="text-3xl text-gray-400 mb-2" />
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        folder={STORAGE_PATHS.STOREFRONT_PRODUCT_IMAGES}
                        contentStatus={formData.status}
                        onUpload={(url) => setFormData(prev => ({ ...prev, image_path: url }))}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C]"
                      >
                        Upload Image
                      </FileUpload>
                    </div>
                  )}
                </div>
              </div>

              {/* Description - Expandable */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">
                  Description *
                  {!descriptionExpanded && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded(true)}
                      className="ml-2 text-xs text-[#B8A692] hover:text-[#A0956C]"
                    >
                      (expand)
                    </button>
                  )}
                  {descriptionExpanded && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded(false)}
                      className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      (collapse)
                    </button>
                  )}
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692] resize-none"
                  style={{ height: descriptionExpanded ? '120px' : '60px' }}
                  placeholder="Product description..."
                  required
                />
              </div>

              {/* Tags - Batch input */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-2">Tags</label>
                {(formData.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(formData.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-[#E3D4C2] text-[#383B26] rounded-full text-xs flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 text-red-600 hover:text-red-800"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBatchTags(newTag);
                      }
                    }}
                    placeholder="Add tags (comma or space separated)"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  />
                  <button
                    type="button"
                    onClick={() => addBatchTags(newTag)}
                    className="px-4 py-2 bg-[#B8A692] text-white rounded-md text-sm hover:bg-[#A0956C]"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas or spaces</p>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
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

      {/* Image Preview Lightbox */}
      {imagePreviewOpen && formData.image_path && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setImagePreviewOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <FaTimes className="w-6 h-6" />
            </button>
            {(() => {
              const parsedUrl = parseSupabaseUrl(formData.image_path)
              if (parsedUrl) {
                return (
                  <SecureImage
                    bucket={parsedUrl.bucket}
                    path={parsedUrl.path}
                    alt="Product Full View"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  />
                )
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontProductModal;