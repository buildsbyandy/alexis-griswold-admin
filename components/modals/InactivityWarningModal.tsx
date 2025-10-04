import React, { useEffect, useState } from 'react';
import { FaExclamationTriangle, FaClock } from 'react-icons/fa';

interface InactivityWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onLogout: () => void;
  remainingSeconds: number;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  onContinue,
  onLogout,
  remainingSeconds
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-4">
            <FaExclamationTriangle className="text-4xl text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#383B26] text-center mb-2">
          Are you still there?
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          You&apos;ve been inactive for 10 minutes. For security reasons, you&apos;ll be automatically logged out in:
        </p>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#E3D4C2] rounded-lg px-6 py-3 flex items-center gap-3">
            <FaClock className="text-2xl text-[#383B26]" />
            <span className="text-3xl font-bold text-[#383B26]">
              {formatTime(remainingSeconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] font-medium transition-colors"
          >
            Continue Working
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium transition-colors"
          >
            Logout Now
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Click &quot;Continue Working&quot; to stay logged in
        </p>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
