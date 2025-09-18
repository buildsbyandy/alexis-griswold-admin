import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaPlay } from 'react-icons/fa';
import { HealingVideo } from '../../lib/services/healingService';
import { VlogVideo } from '../../lib/services/vlogService';

interface FeaturedVideoSelectorModalProps<T extends HealingVideo | VlogVideo> {
  isOpen: boolean;
  onClose: () => void;
  videos: T[];
  currentFeaturedVideoId?: string;
  onSelect: (video: T) => void;
  title: string;
}

const FeaturedVideoSelectorModal = <T extends HealingVideo | VlogVideo>({
  isOpen,
  onClose,
  videos,
  currentFeaturedVideoId,
  onSelect,
  title
}: FeaturedVideoSelectorModalProps<T>) => {
  if (!isOpen) return null;

  const handleSelect = (video: T) => {
    onSelect(video);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No videos available. Please add videos to the carousel first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => {
                const isSelected = currentFeaturedVideoId === video.id;
                const thumbnailUrl: string =
                  typeof (video as any).thumbnailUrl === 'string' && (video as any).thumbnailUrl
                    ? (video as any).thumbnailUrl
                    : typeof (video as any).thumbnail_url === 'string'
                      ? (video as any).thumbnail_url
                      : '';

                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelect(video)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-[#B8A692] ring-2 ring-[#B8A692] ring-opacity-50' 
                        : 'border-gray-200 hover:border-[#B8A692] hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={'title' in video ? video.title : video.video_title}
                          className="w-full h-full object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaPlay size={24} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#B8A692] bg-opacity-20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-2">
                            <FaPlay className="text-[#B8A692]" size={16} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className={`font-medium text-sm line-clamp-2 ${
                        isSelected ? 'text-[#B8A692]' : 'text-gray-800'
                      }`}>
                        {'title' in video ? video.title : video.video_title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Duration: {'duration' in video ? video.duration : 'N/A'}
                      </p>
                      {isSelected && (
                        <div className="mt-2">
                          <span className="inline-block bg-[#B8A692] text-white text-xs px-2 py-1 rounded">
                            Current Featured
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedVideoSelectorModal;