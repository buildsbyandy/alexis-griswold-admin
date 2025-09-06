import React from 'react';

interface ErrorMessageProps {
  error: Error | string;
  retry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-center">
    <div className="text-red-600 mb-2">⚠️ Something went wrong</div>
    <div className="text-sm text-gray-600 mb-4">
      {error instanceof Error ? error.message : error}
    </div>
    {retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-[#B89178] text-white rounded-lg hover:bg-[#A67B62] transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorMessage;
