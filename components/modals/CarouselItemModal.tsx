import React, { useState, useEffect } from 'react';
import { FaTimes, FaVideo, FaImages } from 'react-icons/fa';
import HealingVideoModal from './HealingVideoModal';
import PhotoAlbumModal from './PhotoAlbumModal';
import toast from 'react-hot-toast';
import type { CarouselMixedItem, PageType } from '../../lib/services/carouselService';
import type { HealingVideo } from '../../lib/services/healingService';
import type { PhotoAlbum } from '../../lib/services/albumService';

export type CarouselItemType = 'video' | 'album';

export interface CarouselItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  carouselId: string;
  pageType: PageType;
  item?: CarouselMixedItem | null;
  onSave: (item: CarouselMixedItem) => Promise<void>;
}

const CarouselItemModal: React.FC<CarouselItemModalProps> = ({
  isOpen,
  onClose,
  carouselId,
  pageType,
  item,
  onSave
}) => {
  const [selectedType, setSelectedType] = useState<CarouselItemType>('video');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);

  // Initialize type based on existing item
  useEffect(() => {
    if (item) {
      setSelectedType(item.kind);
    } else {
      setSelectedType('video'); // Default to video for new items
    }
  }, [item]);

  const handleTypeSelection = (type: CarouselItemType) => {
    setSelectedType(type);

    if (type === 'video') {
      setShowVideoModal(true);
    } else {
      setShowAlbumModal(true);
    }
  };

  const handleVideoSave = async (videoData: Omit<HealingVideo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Map video data to carousel item format
      const carouselItem: CarouselMixedItem = {
        kind: 'video',
        id: item?.id || '', // Will be set by service
        youtube_url: videoData.youtube_url,
        thumbnail: videoData.thumbnail_url,
        title: videoData.title,
        description: videoData.description,
        order_index: videoData.order || 0,
        is_active: true,
        created_at: new Date()
      };

      await onSave(carouselItem);
      setShowVideoModal(false);
      onClose();
      toast.success(`Video ${item ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error(`Failed to ${item ? 'update' : 'add'} video`);
    }
  };

  const handleAlbumSave = async (albumData: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Map album data to carousel item format
      const carouselItem: CarouselMixedItem = {
        kind: 'album',
        id: item?.id || '', // Will be set by service
        album_id: '', // This will need to be handled by the album creation process
        title: albumData.title,
        cover: albumData.cover_image_path || null,
        page_type: pageType,
        order_index: albumData.order || 0,
        is_active: albumData.is_visible,
        created_at: new Date()
      };

      await onSave(carouselItem);
      setShowAlbumModal(false);
      onClose();
      toast.success(`Album ${item ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Error saving album:', error);
      toast.error(`Failed to ${item ? 'update' : 'add'} album`);
    }
  };

  if (!isOpen) return null;

  // If we're editing an existing item, go directly to the appropriate modal
  if (item && !showVideoModal && !showAlbumModal) {
    if (item.kind === 'video') {
      setShowVideoModal(true);
    } else {
      setShowAlbumModal(true);
    }
    return null;
  }

  return (
    <>
      {/* Type Selector Modal */}
      {!showVideoModal && !showAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-[#383B26]">
                {item ? `Edit ${item.kind === 'video' ? 'Video' : 'Album'}` : 'Add Carousel Item'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!item && (
                <>
                  <p className="text-gray-600 mb-6">Choose the type of content you want to add to this carousel:</p>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleTypeSelection('video')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#B8A692] hover:bg-gray-50 transition-colors flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-[#B8A692] rounded-lg flex items-center justify-center">
                        <FaVideo className="text-white text-xl" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-[#383B26]">YouTube Video</h3>
                        <p className="text-sm text-gray-600">Add a healing video from YouTube</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTypeSelection('album')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#B8A692] hover:bg-gray-50 transition-colors flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-[#B8A692] rounded-lg flex items-center justify-center">
                        <FaImages className="text-white text-xl" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-[#383B26]">Photo Album</h3>
                        <p className="text-sm text-gray-600">Add a collection of healing photos</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <HealingVideoModal
          isOpen={showVideoModal}
          onClose={() => {
            setShowVideoModal(false);
            if (!item) onClose(); // Close parent if creating new item
          }}
          video={item?.kind === 'video' ? {
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            youtube_url: item.youtube_url,
            thumbnail_url: item.thumbnail || '',
            order: item.order_index,
            is_featured: false,
            created_at: item.created_at,
            updated_at: new Date()
          } : null}
          onSave={handleVideoSave}
        />
      )}

      {/* Album Modal */}
      {showAlbumModal && (
        <PhotoAlbumModal
          isOpen={showAlbumModal}
          onClose={() => {
            setShowAlbumModal(false);
            if (!item) onClose(); // Close parent if creating new item
          }}
          album={item?.kind === 'album' ? {
            id: item.album_id,
            title: item.title,
            description: '',
            page_type: item.page_type || pageType,
            cover_image_path: item.cover,
            images: [],
            order: item.order_index,
            is_visible: item.is_active,
            created_at: item.created_at,
            updated_at: new Date()
          } : null}
          onSave={handleAlbumSave}
          forcePageType={pageType} // Auto-assign page type based on carousel context
        />
      )}
    </>
  );
};

export default CarouselItemModal;