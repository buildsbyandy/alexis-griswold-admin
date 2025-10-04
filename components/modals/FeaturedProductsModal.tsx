import React, { useState } from 'react';
import { FaTimes, FaStar, FaTrash } from 'react-icons/fa';
import type { StorefrontCategoryRow } from '../../lib/types/storefront';
import storefrontService from '../../lib/services/storefrontService';
import toast from 'react-hot-toast';

interface FeaturedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: StorefrontCategoryRow[];
  featuredProductsByCategory: Record<string, Array<{ id: string; ref_id: string; product_title: string | null; order_index: number | null }>>;
  onUpdate: () => void;
}

const FeaturedProductsModal: React.FC<FeaturedProductsModalProps> = ({
  isOpen,
  onClose,
  categories,
  featuredProductsByCategory,
  onUpdate
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.slug || '');

  const handleRemoveFeatured = async (categorySlug: string, productId: string) => {
    try {
      const success = await storefrontService.remove_featured_product_from_category(categorySlug, productId);
      if (success) {
        toast.success('Removed from featured products');
        onUpdate();
      } else {
        toast.error('Failed to remove from featured');
      }
    } catch (error) {
      console.error('Error removing featured product:', error);
      toast.error('Failed to remove from featured');
    }
  };

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.slug === activeCategory);
  const featuredProducts = featuredProductsByCategory[activeCategory] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
            <FaStar className="mr-3 text-yellow-500" />
            Featured Products by Category
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="border-b overflow-x-auto">
          <nav className="flex space-x-4 px-6 min-w-max">
            {categories.map((category) => (
              <button
                key={category.slug}
                className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeCategory === category.slug
                    ? 'border-[#B8A692] text-[#383B26]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveCategory(category.slug)}
              >
                {category.category_name}
                {featuredProductsByCategory[category.slug]?.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {featuredProductsByCategory[category.slug].length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[#383B26] mb-4">
            Featured Products in {currentCategory?.category_name}
          </h3>

          {featuredProducts.length > 0 ? (
            <div className="space-y-3">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FaStar className="text-yellow-500" />
                    <div>
                      <div className="font-medium text-[#383B26]">
                        {product.product_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order: {product.order_index ?? 0}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFeatured(activeCategory, product.ref_id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                    title="Remove from featured"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaStar className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-600 mb-2">No featured products in this category</p>
              <p className="text-sm text-gray-500">
                Click the star icon on product cards to add them to featured
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsModal;
