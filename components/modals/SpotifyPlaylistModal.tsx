import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaMusic, FaPalette } from 'react-icons/fa';
import type { SpotifyPlaylist } from '../../lib/services/vlogService';
import toast from 'react-hot-toast';

interface SpotifyPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist?: SpotifyPlaylist | null;
  onSave: (playlist: Omit<SpotifyPlaylist, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// Predefined color palette for theme colors
const COLOR_PALETTE = [
  '#2D2D2D', // Dark Gray (like in screenshot)
  '#E53E3E', // Red
  '#3182CE', // Blue  
  '#38A169', // Green
  '#D69E2E', // Yellow
  '#9F7AEA', // Purple
  '#ED8936', // Orange
  '#319795', // Teal
  '#E53E3E', // Crimson
  '#1A202C', // Dark Navy
  '#2B6CB0', // Ocean Blue
  '#C53030'  // Deep Red
];

const SpotifyPlaylistModal: React.FC<SpotifyPlaylistModalProps> = ({ isOpen, onClose, playlist, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    mood: '',
    color: '#2D2D2D',
    spotifyUrl: '',
    isActive: true,
    order: 0
  });

  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name,
        mood: playlist.mood,
        color: playlist.color,
        spotifyUrl: playlist.spotifyUrl,
        isActive: playlist.isActive,
        order: playlist.order
      });
    } else {
      // Reset form for new playlist
      setFormData({
        name: '',
        mood: '',
        color: '#2D2D2D',
        spotifyUrl: '',
        isActive: true,
        order: 0
      });
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Playlist name is required');
      return;
    }

    if (!formData.mood.trim()) {
      toast.error('Mood/Theme is required');
      return;
    }

    if (!formData.spotifyUrl.trim()) {
      toast.error('Spotify URL is required');
      return;
    }

    // Validate Spotify URL format
    if (!isValidSpotifyUrl(formData.spotifyUrl)) {
      toast.error('Please enter a valid Spotify playlist URL');
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast.success(`Playlist ${playlist ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${playlist ? 'update' : 'create'} playlist`);
    }
  };

  const isValidSpotifyUrl = (url: string): boolean => {
    const spotifyRegex = /^https:\/\/(open\.)?spotify\.com\/(playlist|album)\/[a-zA-Z0-9]+/;
    return spotifyRegex.test(url);
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setShowColorPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26] flex items-center">
              <FaMusic className="mr-3 text-[#B8A692]" />
              {playlist ? 'Edit Playlist' : 'Add New Playlist'}
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
            {/* Playlist Name */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Playlist Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="e.g., Morning Coffee Vibes"
                required
              />
              <p className="text-xs text-gray-600 mt-1">Display name for the playlist card</p>
            </div>

            {/* Mood/Theme */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Mood/Theme *</label>
              <input
                type="text"
                value={formData.mood}
                onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="e.g., Chill Vibes, Energy Boost, Feel Good"
                required
              />
              <p className="text-xs text-gray-600 mt-1">Short description of the playlist&apos;s mood or theme</p>
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Theme Color *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center space-x-3 w-full p-2 border border-gray-300 rounded-md hover:border-[#B8A692] focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  <span className="text-gray-700">{formData.color}</span>
                  <FaPalette className="ml-auto text-[#B8A692]" />
                </button>
                
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <div className="grid grid-cols-4 gap-3">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform ${
                            formData.color === color ? 'border-[#B8A692] ring-2 ring-[#B8A692]' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-8 rounded border border-gray-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">Or choose custom color</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8F907E] mt-1">This color will be used as the playlist card background</p>
            </div>

            {/* Spotify URL */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Spotify URL *</label>
              <input
                type="url"
                value={formData.spotifyUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, spotifyUrl: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="https://open.spotify.com/playlist/..."
                required
              />
              <p className="text-xs text-[#8F907E] mt-1">
                Paste the Spotify playlist or album URL. You can get this by clicking &quot;Share&quot; on Spotify.
              </p>
            </div>

            {/* Display Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  min="0"
                />
                <p className="text-xs text-[#8F907E] mt-1">Lower numbers appear first</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#383B26]">
                  Show on website
                </label>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-2">Preview</label>
              <div className="border border-gray-200 rounded-lg p-4">
                <div 
                  className="w-48 h-32 rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden"
                  style={{ backgroundColor: formData.color }}
                >
                  <FaMusic className="text-3xl mb-2 opacity-70" />
                  <div className="text-center px-2">
                    <p className="font-medium text-sm">{formData.name || 'Playlist Name'}</p>
                    <p className="text-xs opacity-80">Mood: {formData.mood || 'Mood/Theme'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
            >
              <FaSave className="mr-2" />
              {playlist ? 'Update Playlist' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpotifyPlaylistModal;