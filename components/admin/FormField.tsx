/**
 * Reusable Form Field Component
 * Provides consistent styling and validation display for form inputs
 */

import React from 'react'
import clsx from 'clsx'
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface FormFieldProps {
  label: string
  name: string
  error?: string
  helpText?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export default function FormField({
  label,
  name,
  error,
  helpText,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        {children}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-sm text-gray-500 flex items-center">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {helpText}
        </p>
      )}
    </div>
  )
}