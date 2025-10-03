import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaImage, FaUpload, FaStar, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import type { StorefrontCategoryRow, StorefrontProductRow } from '../../lib/types/storefront';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';
import storefrontService from '../../lib/services/storefrontService';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

interface CategoryPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: StorefrontCategoryRow[];
  onUpdate: () => void;
  category?: StorefrontCategoryRow | null;
  mode?: 'create' | 'edit';
}

const CategoryPhotoModal: React.FC<CategoryPhotoModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdate,
  category: propCategory,
  mode = 'edit'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StorefrontCategoryRow | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photo' | 'featured'>('details');
  const [featuredProducts, setFeaturedProducts] = useState<Array<{ id: string; ref_id: string; product_title: string | null; order_index: number | null }>>([]);
  const [availableProducts, setAvailableProducts] = useState<StorefrontProductRow[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);

  // Form state for create/edit
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryImagePath, setCategoryImagePath] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        // Reset form for new category
        setCategoryName('');
        setCategorySlug('');
        setCategoryDescription('');
        setCategoryImagePath('');
        setIsVisible(true);
        setSelectedCategory(null);
        setActiveTab('details');
      } else if (mode === 'edit' && propCategory) {
        // Load existing category data
        setSelectedCategory(propCategory);
        setCategoryName(propCategory.category_name);
        setCategorySlug(propCategory.slug);
        setCategoryDescription(propCategory.category_description || '');
        setCategoryImagePath(propCategory.category_image_path || '');
        setIsVisible(propCategory.is_visible ?? true);
        setActiveTab('details');
      } else if (mode === 'edit' && categories.length > 0 && !selectedCategory) {
        // Fallback for old behavior
        setSelectedCategory(categories[0]);
      }
    }
  }, [isOpen, mode, propCategory, categories, selectedCategory]);

  const loadFeaturedProducts = async () => {
    if (!selectedCategory) return;

    setIsLoadingFeatured(true);
    try {
      const featured = await storefrontService.list_featured_products_for_category(selectedCategory.slug);
      setFeaturedProducts(featured);
    } catch (error) {
      console.error('Error loading featured products:', error);
      toast.error('Failed to load featured products');
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  const loadAvailableProducts = async () => {
    if (!selectedCategory) return;

    try {
      const products = await storefrontService.get_storefront_products({
        filters: { category_slug: selectedCategory.slug, status: 'published' }
      });
      setAvailableProducts(products);
    } catch (error) {
      console.error('Error loading available products:', error);
      toast.error('Failed to load available products');
    }
  };

  useEffect(() => {
    if (selectedCategory && activeTab === 'featured') {
      loadFeaturedProducts();
      loadAvailableProducts();
    }
  }, [selectedCategory, activeTab, loadFeaturedProducts, loadAvailableProducts]);

  const handleAddFeaturedProduct = async (productId: string) => {
    if (!selectedCategory) return;

    setIsUpdating(true);
    try {
      const success = await storefrontService.add_featured_product_to_category(
        selectedCategory.slug,
        productId,
        featuredProducts.length // Add at the end
      );

      if (success) {
        await loadFeaturedProducts();
        toast.success('Product added to featured list!');
      } else {
        toast.error('Failed to add product to featured list');
      }
    } catch (error) {
      console.error('Error adding featured product:', error);
      toast.error('Failed to add product to featured list');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFeaturedProduct = async (productId: string) => {
    if (!selectedCategory) return;

    setIsUpdating(true);
    try {
      const success = await storefrontService.remove_featured_product_from_category(
        selectedCategory.slug,
        productId
      );

      if (success) {
        await loadFeaturedProducts();
        toast.success('Product removed from featured list!');
      } else {
        toast.error('Failed to remove product from featured list');
      }
    } catch (error) {
      console.error('Error removing featured product:', error);
      toast.error('Failed to remove product from featured list');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleNameChange = (name: string) => {
    setCategoryName(name);
    // Auto-generate slug if creating new category or slug is empty
    if (mode === 'create' || !categorySlug) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setCategorySlug(slug);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!categorySlug.trim()) {
      toast.error('Category slug is required');
      return;
    }

    setIsUpdating(true);
    try {
      if (mode === 'create') {
        await storefrontService.create_storefront_category({
          category_name: categoryName,
          slug: categorySlug,
          category_description: categoryDescription || undefined,
          category_image_path: categoryImagePath || undefined,
          is_visible: isVisible,
          sort_order: undefined
        });
        toast.success('Category created successfully!');
      } else if (selectedCategory) {
        await storefrontService.update_storefront_category(selectedCategory.id, {
          category_name: categoryName,
          slug: categorySlug,
          category_description: categoryDescription || undefined,
          category_image_path: categoryImagePath || undefined,
          is_visible: isVisible
        });
        toast.success('Category updated successfully!');
      }

      onUpdate(); // Refresh the categories list
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
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
            {mode === 'create' ? 'Create Category' : 'Manage Category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-[#B8A692] text-[#383B26]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <FaEdit className="inline mr-2" />
              Category Details
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'photo'
                  ? 'border-[#B8A692] text-[#383B26]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('photo')}
              disabled={mode === 'create'}
            >
              <FaImage className="inline mr-2" />
              Category Photo
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'featured'
                  ? 'border-[#B8A692] text-[#383B26]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('featured')}
              disabled={mode === 'create'}
            >
              <FaStar className="inline mr-2" />
              Featured Products
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Tab Content */}
          {activeTab === 'details' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    placeholder="e.g., Food, Home, Personal Care"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    placeholder="e.g., food, home, personal-care"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated from name)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#383B26] mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    placeholder="Brief description of this category"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isVisible" className="text-sm text-[#383B26]">
                    Visible on website
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === 'photo' && (
            <>

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
                        folder={STORAGE_PATHS.STOREFRONT_CATEGORY_IMAGES}
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
                        folder={STORAGE_PATHS.STOREFRONT_CATEGORY_IMAGES}
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
                {/* Legacy is_featured field removed - featured status managed by carousel system */}
              </div>
            </div>
          )}
          </>
          )}

          {/* Featured Products Tab */}
          {activeTab === 'featured' && selectedCategory && (
            <>
              <div>
                <h3 className="font-medium text-[#383B26] mb-3">Featured Products for {selectedCategory.category_name}</h3>

                {isLoadingFeatured ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading featured products...</p>
                  </div>
                ) : (
                  <>
                    {/* Current Featured Products */}
                    {featuredProducts.length > 0 ? (
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-medium text-gray-700">Currently Featured:</h4>
                        {featuredProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <span className="font-medium">{product.product_title}</span>
                              <span className="text-sm text-gray-500 ml-2">(Order: {product.order_index})</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFeaturedProduct(product.ref_id)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-md mb-6">
                        <FaStar className="mx-auto text-2xl text-gray-400 mb-2" />
                        <p className="text-gray-500">No featured products for this category</p>
                      </div>
                    )}

                    {/* Available Products to Add */}
                    {availableProducts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add Products to Featured:</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableProducts
                            .filter(product => !featuredProducts.some(fp => fp.ref_id === product.id))
                            .map((product) => (
                              <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                <div>
                                  <span className="font-medium">{product.product_title}</span>
                                  <span className="text-sm text-gray-500 ml-2">({product.status})</span>
                                </div>
                                <button
                                  onClick={() => handleAddFeaturedProduct(product.id)}
                                  disabled={isUpdating}
                                  className="text-[#B8A692] hover:text-[#A0956C] disabled:opacity-50"
                                >
                                  <FaPlus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {availableProducts.length === 0 && (
                      <div className="text-center py-4 bg-yellow-50 rounded-md">
                        <p className="text-yellow-600">No published products found in this category</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isUpdating}
          >
            Cancel
          </button>
          {activeTab === 'details' && (
            <button
              type="button"
              onClick={handleSaveCategory}
              disabled={isUpdating}
              className="px-6 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-2" />
              {mode === 'create' ? 'Create Category' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPhotoModal;
