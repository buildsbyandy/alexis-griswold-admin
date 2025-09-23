import React, { useState } from 'react';
import { FaTimes, FaVideo, FaImages } from 'react-icons/fa';
import HealingVideoModal from './HealingVideoModal';
import PhotoAlbumModal from './PhotoAlbumModal';
import type { HealingVideo } from '../../lib/services/healingService';
import type { PhotoAlbum } from '../../lib/services/albumService';

export type ContentType = 'video' | 'album';

export interface HealingCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVideo?: HealingVideo | null;
  onSave: (data: { type: ContentType; data: any }) => Promise<void>;
}

const HealingCarouselModal: React.FC<HealingCarouselModalProps> = ({
  isOpen,
  onClose,
  editingVideo,
  onSave
}) => {
  const [selectedType, setSelectedType] = useState<ContentType>('video');
  const [showTypeSelector, setShowTypeSelector] = useState(true);

  // If editing an existing video, skip type selection
  React.useEffect(() => {
    if (editingVideo) {
      setSelectedType('video');
      setShowTypeSelector(false);
    } else {
      setShowTypeSelector(true);
    }
  }, [editingVideo]);

  // Handle closing the modal - reset to type selector
  const handleClose = () => {
    setShowTypeSelector(true);
    setSelectedType('video');
    onClose();
  };

  const handleVideoSave = async (videoData: Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSave({ type: 'video', data: videoData });
  };

  const handleAlbumSave = async (albumData: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'>) => {
    await onSave({ type: 'album', data: albumData });
  };

  if (!isOpen) return null;

  // Show type selector for new items
  if (showTypeSelector && !editingVideo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-[#383B26]">Add Content to Healing Carousel</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">What type of content would you like to add?</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedType('video');
                  setShowTypeSelector(false);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#B8A692] hover:bg-gray-50 flex items-center"
              >
                <FaVideo className="text-2xl text-[#B8A692] mr-4" />
                <div className="text-left">
                  <div className="font-semibold text-[#383B26]">YouTube Video</div>
                  <div className="text-sm text-gray-600">Add a healing video from YouTube</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedType('album');
                  setShowTypeSelector(false);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#B8A692] hover:bg-gray-50 flex items-center"
              >
                <FaImages className="text-2xl text-[#B8A692] mr-4" />
                <div className="text-left">
                  <div className="font-semibold text-[#383B26]">Photo Album</div>
                  <div className="text-sm text-gray-600">Create a photo album for healing content</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the appropriate modal based on selection
  return (
    <>
      {selectedType === 'video' && (
        <HealingVideoModal
          isOpen={true}
          onClose={handleClose}
          video={editingVideo}
          onSave={handleVideoSave}
        />
      )}

      {selectedType === 'album' && (
        <PhotoAlbumModal
          isOpen={true}
          onClose={handleClose}
          album={null}
          onSave={handleAlbumSave}
          forcePageType="healing"
        />
      )}
    </>
  );
};

export default HealingCarouselModal;