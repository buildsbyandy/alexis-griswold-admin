import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaExclamationTriangle, FaImages } from 'react-icons/fa';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';
import { FileUploadService } from '@/lib/utils/fileUpload';
import toast from 'react-hot-toast';

export interface RecipeStep {
  id?: string;
  step_order: number;
  image_path: string | null;
  description: string | null;
  isNew?: boolean; // Track if this is a new step not yet saved
}

interface RecipeStepsBuilderProps {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}

const RecipeStepsBuilder: React.FC<RecipeStepsBuilderProps> = ({ steps, onChange }) => {
  const [localSteps, setLocalSteps] = useState<RecipeStep[]>(steps);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  const addStep = () => {
    const newStep: RecipeStep = {
      step_order: localSteps.length,
      image_path: null,
      description: '',
      isNew: true
    };
    const updated = [...localSteps, newStep];
    setLocalSteps(updated);
    onChange(updated);
  };

  const removeStep = (index: number) => {
    const updated = localSteps.filter((_, i) => i !== index);
    // Reorder remaining steps
    const reordered = updated.map((step, i) => ({ ...step, step_order: i }));
    setLocalSteps(reordered);
    onChange(reordered);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === localSteps.length - 1)
    ) {
      return;
    }

    const updated = [...localSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

    // Update step_order
    const reordered = updated.map((step, i) => ({ ...step, step_order: i }));
    setLocalSteps(reordered);
    onChange(reordered);
  };

  const updateStepImage = (index: number, imagePath: string) => {
    const updated = [...localSteps];
    updated[index] = { ...updated[index], image_path: imagePath };
    setLocalSteps(updated);
    onChange(updated);
  };

  const updateStepDescription = (index: number, description: string) => {
    const updated = [...localSteps];
    updated[index] = { ...updated[index], description };
    setLocalSteps(updated);
    onChange(updated);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    toast.loading(`Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`, { id: 'bulk-upload' });

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await FileUploadService.uploadImage(file, 'recipe', 'draft');
        if (result.success && result.url) {
          return result.url;
        }
        throw new Error(result.error || 'Upload failed');
      });

      const uploadedPaths = await Promise.all(uploadPromises);

      // Create new steps for each uploaded image
      const newSteps: RecipeStep[] = uploadedPaths.map((path, index) => ({
        step_order: localSteps.length + index,
        image_path: path,
        description: '',
        isNew: true
      }));

      const updated = [...localSteps, ...newSteps];
      setLocalSteps(updated);
      onChange(updated);

      toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}!`, { id: 'bulk-upload' });
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: 'bulk-upload' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSingleImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading('Uploading image...', { id: 'single-upload' });

    try {
      const result = await FileUploadService.uploadImage(file, 'recipe', 'draft');
      if (result.success && result.url) {
        updateStepImage(index, result.url);
        toast.success('Image uploaded successfully!', { id: 'single-upload' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: 'single-upload' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#383B26]">Recipe Steps</h3>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-[#7A9D7E] text-white rounded-md hover:bg-[#6B8A6E] flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaImages className="mr-2" />
            {uploading ? 'Uploading...' : 'Bulk Upload Images'}
          </button>
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center text-sm"
          >
            <FaPlus className="mr-2" />
            Add Step
          </button>
        </div>
      </div>

      {localSteps.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <FaImages className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2 font-medium">No steps added yet</p>
          <p className="text-gray-400 text-sm mb-4">Upload multiple images at once or add steps one by one</p>
          <div className="flex items-center gap-2 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-[#7A9D7E] text-white rounded-md hover:bg-[#6B8A6E] flex items-center disabled:opacity-50"
            >
              <FaImages className="mr-2" />
              Bulk Upload Images
            </button>
            <span className="text-gray-400">or</span>
            <button
              type="button"
              onClick={addStep}
              className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Single Step
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {localSteps.map((step, index) => (
            <div
              key={step.id || `new-${index}`}
              className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-[#B8A692] transition-colors"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-md font-semibold text-[#383B26]">
                    Step {index + 1}
                  </h4>
                  {!step.description?.trim() && (
                    <div className="flex items-center gap-1 text-amber-600" title="Adding a description improves SEO and accessibility">
                      <FaExclamationTriangle className="text-sm" />
                      <span className="text-xs">Description recommended for SEO</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Reorder buttons */}
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                    className={`p-2 rounded ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Move up"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === localSteps.length - 1}
                    className={`p-2 rounded ${
                      index === localSteps.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Move down"
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete step"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Step Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#383B26] mb-2">
                  Step Image {index === 0 && <span className="text-xs text-gray-500">(Will be used as hero image)</span>}
                </label>
                {step.image_path ? (
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                      {(() => {
                        const parsed = parseSupabaseUrl(step.image_path);
                        if (!parsed) return null;
                        return (
                          <SecureImage
                            bucket={parsed.bucket}
                            path={parsed.path}
                            alt={`Step ${index + 1}`}
                            width={400}
                            height={256}
                            className="w-full h-full object-cover"
                          />
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStepImage(index, '')}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageUpload(index, e)}
                      className="hidden"
                      id={`step-image-${index}`}
                    />
                    <label
                      htmlFor={`step-image-${index}`}
                      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#B8A692] bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                    >
                      <FaPlus className="text-3xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Upload Step Image</span>
                      <span className="text-xs text-gray-500 mt-1">Click to browse</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Step Description */}
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-2">
                  Step Description *
                </label>
                <textarea
                  value={step.description || ''}
                  onChange={(e) => updateStepDescription(index, e.target.value)}
                  placeholder={`e.g., "Chop the onions into small pieces and set aside"`}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe what the user should do in this step
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {localSteps.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 text-sm text-[#B8A692] border-2 border-dashed border-[#B8A692] rounded-md hover:bg-[#B8A692] hover:text-white transition-colors"
          >
            <FaPlus className="inline mr-2" />
            Add Another Step
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeStepsBuilder;
