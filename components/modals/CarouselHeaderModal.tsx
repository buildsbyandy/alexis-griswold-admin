import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';

export interface CarouselHeader {
  id: string;
  title: string;
  description: string;
  type: 'part1' | 'part2';
  isActive: boolean;
  updatedAt: Date;
}

interface CarouselHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  carouselHeader?: CarouselHeader | null;
  onSave: (header: Omit<CarouselHeader, 'id' | 'updatedAt'>) => Promise<void>;
}

const CarouselHeaderModal: React.FC<CarouselHeaderModalProps> = ({ isOpen, onClose, carouselHeader, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'part1' as 'part1' | 'part2',
    isActive: true,
  });

  useEffect(() => {
    if (carouselHeader) {
      setFormData({
        title: carouselHeader.title,
        description: carouselHeader.description,
        type: carouselHeader.type,
        isActive: carouselHeader.isActive,
      });
    } else {
      // Reset form for new carousel header
      setFormData({
        title: '',
        description: '',
        type: 'part1',
        isActive: true,
      });
    }
  }, [carouselHeader]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Carousel title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Carousel description is required');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success(`Carousel header ${carouselHeader ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${carouselHeader ? 'update' : 'create'} carousel header`);
    }
  };

  const getTypeDisplayName = (type: 'part1' | 'part2') => {
    return type === 'part1' ? 'Gut Healing Part 1' : 'Gut Healing Part 2';
  };

  const getDefaultTitle = (type: 'part1' | 'part2') => {
    return type === 'part1' ? 'Gut Healing Part 1: Candida Cleanse' : 'Gut Healing Part 2: Rebuild & Repair';
  };

  const getDefaultDescription = (type: 'part1' | 'part2') => {
    return type === 'part1' 
      ? 'Educational videos for candida cleansing process'
      : 'Videos focused on rebuilding gut health after cleansing';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaVideo className="mr-3 text-[#B8A692]" />
              Edit Carousel Header
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
            {/* Carousel Type */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Carousel Section *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'part1' | 'part2';
                  setFormData(prev => ({
                    ...prev,
                    type: newType,
                    title: prev.title || getDefaultTitle(newType),
                    description: prev.description || getDefaultDescription(newType)
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                required
              >
                <option value="part1">Gut Healing Part 1: Candida Cleanse</option>
                <option value="part2">Gut Healing Part 2: Rebuild & Repair</option>
              </select>
            </div>

            {/* Carousel Title */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Section Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder={getDefaultTitle(formData.type)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">This title will appear above the video carousel</p>
            </div>

            {/* Carousel Description */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Section Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder={getDefaultDescription(formData.type)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Brief description of what this carousel section contains</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-[#B8A692] focus:ring-[#B8A692] border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#383B26]">Active Section</span>
                    <p className="text-xs text-gray-500">Display this carousel section on the healing page</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-[#383B26] mb-2">Preview:</h4>
              <div>
                <h3 className="font-medium text-[#383B26] mb-1">{formData.title || getDefaultTitle(formData.type)}</h3>
                <p className="text-sm text-[#8F907E]">{formData.description || getDefaultDescription(formData.type)}</p>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarouselHeaderModal;