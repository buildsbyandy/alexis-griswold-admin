/**
 * Character Counter Component
 * 
 * Provides visual feedback for character limits with consistent styling
 * across all admin forms.
 */

import React from 'react';
import { getCharacterCount, getRemainingCharacters, getValidationStatus, getValidationMessage } from '../../lib/validation/characterLimits';

interface CharacterCounterProps {
  text: string;
  limit: number;
  fieldName: string;
  showCounter?: boolean;
  showMessage?: boolean;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  text,
  limit,
  fieldName,
  showCounter = true,
  showMessage = true,
  className = '',
}) => {
  const count = getCharacterCount(text);
  const remaining = getRemainingCharacters(text, limit);
  const status = getValidationStatus(text, limit);
  const message = getValidationMessage(text, limit, fieldName);

  // Status-based styling
  const getStatusStyles = () => {
    switch (status) {
      case 'error':
        return {
          counter: 'text-red-600 font-semibold',
          message: 'text-red-600',
          bg: 'bg-red-50',
        };
      case 'warning':
        return {
          counter: 'text-amber-600 font-medium',
          message: 'text-amber-600',
          bg: 'bg-amber-50',
        };
      case 'success':
        return {
          counter: 'text-gray-500',
          message: 'text-gray-600',
          bg: 'bg-gray-50',
        };
      default:
        return {
          counter: 'text-gray-500',
          message: 'text-gray-600',
          bg: 'bg-gray-50',
        };
    }
  };

  const styles = getStatusStyles();

  if (!showCounter && !showMessage) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between text-xs mt-1 ${className}`}>
      {/* Character counter */}
      {showCounter && (
        <div className={`${styles.counter} transition-colors duration-200`}>
          {count}/{limit}
        </div>
      )}

      {/* Validation message */}
      {showMessage && message && (
        <div className={`${styles.message} transition-colors duration-200`}>
          {message}
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced Input with Character Counter
 */
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  limit: number;
  fieldName: string;
  error?: string;
  showCounter?: boolean;
  required?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  limit,
  fieldName,
  error,
  showCounter = true,
  required = false,
  className = '',
  value = '',
  ...props
}) => {
  const text = String(value);
  const status = getValidationStatus(text, limit);
  
  const getInputStyles = () => {
    if (error || status === 'error') {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';
    }
    if (status === 'warning') {
      return 'border-amber-300 focus:border-amber-500 focus:ring-amber-500';
    }
    return 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <input
        {...props}
        value={value}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors duration-200
          focus:ring-2 focus:ring-opacity-20 focus:outline-none
          ${getInputStyles()}
          ${className}
        `}
      />

      {/* Character counter and validation */}
      <div className="flex items-center justify-between">
        <CharacterCounter
          text={text}
          limit={limit}
          fieldName={fieldName}
          showCounter={showCounter}
          showMessage={true}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Enhanced Textarea with Character Counter
 */
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  limit: number;
  fieldName: string;
  error?: string;
  showCounter?: boolean;
  required?: boolean;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  limit,
  fieldName,
  error,
  showCounter = true,
  required = false,
  className = '',
  value = '',
  ...props
}) => {
  const text = String(value);
  const status = getValidationStatus(text, limit);
  
  const getTextareaStyles = () => {
    if (error || status === 'error') {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';
    }
    if (status === 'warning') {
      return 'border-amber-300 focus:border-amber-500 focus:ring-amber-500';
    }
    return 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Textarea */}
      <textarea
        {...props}
        value={value}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors duration-200
          focus:ring-2 focus:ring-opacity-20 focus:outline-none
          resize-vertical min-h-[80px]
          ${getTextareaStyles()}
          ${className}
        `}
      />

      {/* Character counter and validation */}
      <div className="flex items-center justify-between">
        <CharacterCounter
          text={text}
          limit={limit}
          fieldName={fieldName}
          showCounter={showCounter}
          showMessage={true}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CharacterCounter;
