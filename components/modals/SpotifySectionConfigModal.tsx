import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface SpotifySectionConfig {
  section_title: string;
  section_subtitle: string;
}

interface SpotifySectionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: SpotifySectionConfig;
  onSave: (data: SpotifySectionConfig) => Promise<void>;
}

const SpotifySectionConfigModal: React.FC<SpotifySectionConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}) => {
  const [formData, setFormData] = useState<SpotifySectionConfig>({
    section_title: '',
    section_subtitle: ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        section_title: initialData.section_title || '',
        section_subtitle: initialData.section_subtitle || ''
      });
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Spotify section configuration updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save Spotify section config:', error);
      toast.error('Failed to save section configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SpotifySectionConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#383B26]">Edit Spotify Section</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={formData.section_title}
                onChange={(e) => updateField('section_title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Section title for Spotify playlists"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={formData.section_subtitle}
                onChange={(e) => updateField('section_subtitle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Section subtitle for Spotify playlists"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotifySectionConfigModal;
