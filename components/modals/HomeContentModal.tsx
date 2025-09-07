import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface HomeContentData {
  hero_main_title: string;
  hero_subtitle: string;
  video_title: string;
  video_description: string;
  heroMainTitle?: string;
  heroSubtitle?: string;
  videoTitle?: string;
  videoDescription?: string;
}

interface HomeContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: HomeContentData;
  onSave: (data: HomeContentData) => Promise<void>;
}

const HomeContentModal: React.FC<HomeContentModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState<HomeContentData>({
    hero_main_title: '',
    hero_subtitle: '',
    video_title: '',
    video_description: '',
    heroMainTitle: '',
    heroSubtitle: '',
    videoTitle: '',
    videoDescription: ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        hero_main_title: initialData.hero_main_title || initialData.heroMainTitle || '',
        hero_subtitle: initialData.hero_subtitle || initialData.heroSubtitle || '',
        video_title: initialData.video_title || initialData.videoTitle || '',
        video_description: initialData.video_description || initialData.videoDescription || '',
        heroMainTitle: initialData.hero_main_title || initialData.heroMainTitle || '',
        heroSubtitle: initialData.hero_subtitle || initialData.heroSubtitle || '',
        videoTitle: initialData.video_title || initialData.videoTitle || '',
        videoDescription: initialData.video_description || initialData.videoDescription || ''
      });
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Home content updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save home content:', error);
      toast.error('Failed to save home content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof HomeContentData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Sync snake_case and camelCase versions
      if (field === 'heroMainTitle') {
        updated.hero_main_title = value;
      } else if (field === 'hero_main_title') {
        updated.heroMainTitle = value;
      } else if (field === 'heroSubtitle') {
        updated.hero_subtitle = value;
      } else if (field === 'hero_subtitle') {
        updated.heroSubtitle = value;
      } else if (field === 'videoTitle') {
        updated.video_title = value;
      } else if (field === 'video_title') {
        updated.videoTitle = value;
      } else if (field === 'videoDescription') {
        updated.video_description = value;
      } else if (field === 'video_description') {
        updated.videoDescription = value;
      }
      
      return updated;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F3F0]">
          <h2 className="text-xl font-semibold text-[#383B26]">Edit Home Content</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Hero Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#383B26] border-b border-gray-200 pb-2">Hero Section</h3>
            
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Hero Main Title
              </label>
              <input
                type="text"
                value={formData.heroMainTitle || ''}
                onChange={(e) => updateField('heroMainTitle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Main title displayed on the home page"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Hero Subtitle
              </label>
              <textarea
                value={formData.heroSubtitle || ''}
                onChange={(e) => updateField('heroSubtitle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Subtitle displayed on the home page"
              />
            </div>
          </div>

          {/* SEO Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#383B26] border-b border-gray-200 pb-2">SEO & Accessibility Fields</h3>
            <p className="text-sm text-[#8F907E]">These fields are used for search engines and screen readers</p>
            
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Video Title (SEO)
              </label>
              <input
                type="text"
                value={formData.videoTitle || ''}
                onChange={(e) => updateField('videoTitle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Title for search engines and social media"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Video Description (SEO)
              </label>
              <textarea
                value={formData.videoDescription || ''}
                onChange={(e) => updateField('videoDescription', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Description for search engines and social media"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#383B26] bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeContentModal;