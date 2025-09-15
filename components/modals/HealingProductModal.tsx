import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaHeartbeat } from 'react-icons/fa';
import FileUpload from '../ui/FileUpload';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import toast from 'react-hot-toast';

export interface HealingProduct {
  id: string;
  name: string;
  purpose: string;
  howToUse: string;
  imageUrl: string;
  amazonUrl: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface HealingProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: HealingProduct | null;
  onSave: (product: Omit<HealingProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const HealingProductModal: React.FC<HealingProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    howToUse: '',
    imageUrl: '',
    amazonUrl: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        purpose: product.purpose,
        howToUse: product.howToUse,
        imageUrl: product.imageUrl,
        amazonUrl: product.amazonUrl,
        isActive: product.isActive,
        order: product.order,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        purpose: '',
        howToUse: '',
        imageUrl: '',
        amazonUrl: '',
        isActive: true,
        order: 0,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.purpose.trim()) {
      toast.error('Product purpose is required');
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaHeartbeat className="mr-3 text-[#B8A692]" />
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
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Purpose *</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="What is this product for?"
                required
              />
            </div>

            {/* How to Use */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">How to Use</label>
              <textarea
                value={formData.howToUse}
                onChange={(e) => setFormData(prev => ({ ...prev, howToUse: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Instructions for use"
              />
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-3">Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.imageUrl ? (
                  <div className="relative">
                    {(() => {
                      const parsedUrl = parseSupabaseUrl(formData.imageUrl)
                      if (parsedUrl) {
                        return (
                          <SecureImage
                            bucket={parsedUrl.bucket}
                            path={parsedUrl.path}
                            alt="Product"
                            width={400}
                            height={192}
                            className="w-full h-48 object-cover rounded"
                          />
                        )
                      } else {
                        return (
                          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400">Invalid image URL</span>
                          </div>
                        )
                      }
                    })()}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        onUpload={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                      >
                        Change Image
                      </FileUpload>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaHeartbeat className="mx-auto text-4xl text-gray-400 mb-4" />
                    <FileUpload
                      accept="image/*"
                      uploadType="image"
                      onUpload={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                      className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                    >
                      Upload Product Image
                    </FileUpload>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#383B26] mb-1">Or enter image URL:</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                        placeholder="https://example.com/product-image.jpg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amazon URL */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Amazon URL</label>
              <input
                type="url"
                value={formData.amazonUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, amazonUrl: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="https://amazon.com/product-link"
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-[#B8A692] focus:ring-[#B8A692] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#383B26]">Active Product</span>
                    <p className="text-xs text-gray-500">Display on healing page</p>
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
              {product ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealingProductModal;