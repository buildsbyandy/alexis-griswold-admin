import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading your dashboard...',
  progress
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="relative inline-block mb-6">
          <FaSpinner
            className="animate-spin text-6xl text-[#B8A692]"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#383B26] border-opacity-20 rounded-full"></div>
          </div>
        </div>

        {/* Loading Message */}
        <h2 className="text-2xl font-semibold text-[#383B26] mb-2">
          {message}
        </h2>

        {/* Optional Progress Bar */}
        {progress !== undefined && (
          <div className="w-64 mx-auto mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B8A692] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-[#8F907E] mt-2">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* Subtle Animation Effect */}
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-2 h-2 bg-[#B8A692] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#B8A692] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#B8A692] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
