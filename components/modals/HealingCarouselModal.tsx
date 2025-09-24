import React, { useState } from 'react';
import { FaTimes, FaVideo, FaImages } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import HealingVideoModal from './HealingVideoModal';
import PhotoAlbumModal from './PhotoAlbumModal';
import TikTokVideoModal from './TikTokVideoModal';
import type { HealingVideo } from '../../lib/services/healingService';
import type { PhotoAlbum } from '../../lib/services/albumService';

export type ContentType = 'video' | 'album' | 'tiktok';
export type CarouselContext = 'part1' | 'part2' | 'tiktoks';

export interface TikTokVideo {
  link_url: string;
  caption?: string;
  order_index: number;
}

export interface HealingCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVideo?: HealingVideo | null;
  carouselContext?: CarouselContext; // New: determines which carousel this modal is for
  onSave: (data: { type: ContentType; data: any }) => Promise<void>;
}

const HealingCarouselModal: React.FC<HealingCarouselModalProps> = ({
  isOpen,
  onClose,
  editingVideo,
  carouselContext = 'part1', // Default to part1 for backward compatibility
  onSave
}) => {
  const [selectedType, setSelectedType] = useState<ContentType>('video');
  const [showTypeSelector, setShowTypeSelector] = useState(true);

  // Determine available content types based on carousel context
  const getAvailableContentTypes = (): ContentType[] => {
    switch (carouselContext) {
      case 'part1':
      case 'part2':
        return ['album']; // Only albums for carousels 1 & 2
      case 'tiktoks':
        return ['tiktok']; // Only TikTok for carousel 3
      default:
        return ['video', 'album']; // Fallback to original behavior
    }
  };

  const availableContentTypes = getAvailableContentTypes();

  // If editing an existing video, skip type selection
  React.useEffect(() => {
    if (editingVideo) {
      setSelectedType('video');
      setShowTypeSelector(false);
    } else {
      // For single content type carousels, skip type selection
      if (availableContentTypes.length === 1) {
        setSelectedType(availableContentTypes[0]);
        setShowTypeSelector(false);
      } else {
        setShowTypeSelector(true);
        setSelectedType(availableContentTypes[0]); // Default to first available type
      }
    }
  }, [editingVideo, carouselContext, availableContentTypes]);

  // Handle closing the modal - reset to type selector
  const handleClose = () => {
    if (availableContentTypes.length > 1) {
      setShowTypeSelector(true);
      setSelectedType(availableContentTypes[0]);
    }
    onClose();
  };

  const handleVideoSave = async (videoData: Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSave({ type: 'video', data: videoData });
  };

  const handleAlbumSave = async (albumData: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'>) => {
    await onSave({ type: 'album', data: albumData });
  };

  const handleTikTokSave = async (tiktokData: TikTokVideo) => {
    await onSave({ type: 'tiktok', data: tiktokData });
  };

  if (!isOpen) return null;

  // Show type selector for new items (only if multiple types are available)
  if (showTypeSelector && !editingVideo && availableContentTypes.length > 1) {
    const getCarouselTitle = () => {
      switch (carouselContext) {
        case 'part1': return 'Healing Carousel Part 1';
        case 'part2': return 'Healing Carousel Part 2';
        case 'tiktoks': return 'TikTok Inspirations Carousel';
        default: return 'Healing Carousel';
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-[#383B26]">Add Content to {getCarouselTitle()}</h2>
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
              {availableContentTypes.includes('video') && (
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
              )}

              {availableContentTypes.includes('album') && (
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
              )}

              {availableContentTypes.includes('tiktok') && (
                <button
                  onClick={() => {
                    setSelectedType('tiktok');
                    setShowTypeSelector(false);
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#B8A692] hover:bg-gray-50 flex items-center"
                >
                  <SiTiktok className="text-2xl text-[#B8A692] mr-4" />
                  <div className="text-left">
                    <div className="font-semibold text-[#383B26]">TikTok Video</div>
                    <div className="text-sm text-gray-600">Add an inspiring TikTok video</div>
                  </div>
                </button>
              )}
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

      {selectedType === 'tiktok' && (
        <TikTokVideoModal
          isOpen={true}
          onClose={handleClose}
          onSave={handleTikTokSave}
        />
      )}
    </>
  );
};

export default HealingCarouselModal;