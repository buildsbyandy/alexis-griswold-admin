import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaExclamationTriangle, FaImages } from 'react-icons/fa';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import Image from 'next/image';

export interface RecipeStep {
  id?: string;
  step_order: number;
  image_path: string | null;
  description: string | null;
  isNew?: boolean; // Track if this is a new step not yet saved
  pendingFile?: File; // File waiting to be uploaded on save
}

export interface PendingStepUpload {
  stepIndex: number;
  file: File;
}

interface RecipeStepsBuilderProps {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[], pendingUploads?: PendingStepUpload[]) => void;
  status?: 'draft' | 'published' | 'archived';
}

const RecipeStepsBuilder: React.FC<RecipeStepsBuilderProps> = ({ steps, onChange, status = 'published' }) => {
  const [localSteps, setLocalSteps] = useState<RecipeStep[]>(steps);
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const addStep = () => {
    const newStep: RecipeStep = {
      step_order: localSteps.length,
      image_path: null,
      description: '',
      isNew: true
    };
    const updated = [...localSteps, newStep];
    setLocalSteps(updated);
    notifyChange(updated);
  };

  const removeStep = (index: number) => {
    // Revoke preview URL if exists
    const previewUrl = previewUrls.get(index);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      const newPreviews = new Map(previewUrls);
      newPreviews.delete(index);
      setPreviewUrls(newPreviews);
    }

    const updated = localSteps.filter((_, i) => i !== index);
    // Reorder remaining steps and update preview URLs
    const reordered = updated.map((step, i) => ({ ...step, step_order: i }));

    // Rebuild preview URLs map with new indices
    const newPreviewsMap = new Map<number, string>();
    previewUrls.forEach((url, oldIndex) => {
      if (oldIndex < index) {
        newPreviewsMap.set(oldIndex, url);
      } else if (oldIndex > index) {
        newPreviewsMap.set(oldIndex - 1, url);
      }
    });
    setPreviewUrls(newPreviewsMap);

    setLocalSteps(reordered);
    notifyChange(reordered);
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

    // Swap preview URLs too
    const newPreviews = new Map(previewUrls);
    const previewA = previewUrls.get(index);
    const previewB = previewUrls.get(targetIndex);
    if (previewA) newPreviews.set(targetIndex, previewA);
    else newPreviews.delete(targetIndex);
    if (previewB) newPreviews.set(index, previewB);
    else newPreviews.delete(index);
    setPreviewUrls(newPreviews);

    // Update step_order
    const reordered = updated.map((step, i) => ({ ...step, step_order: i }));
    setLocalSteps(reordered);
    notifyChange(reordered);
  };

  const updateStepImage = (index: number, imagePath: string) => {
    const updated = [...localSteps];
    updated[index] = { ...updated[index], image_path: imagePath, pendingFile: undefined };

    // Revoke old preview URL
    const oldPreview = previewUrls.get(index);
    if (oldPreview) {
      URL.revokeObjectURL(oldPreview);
      const newPreviews = new Map(previewUrls);
      newPreviews.delete(index);
      setPreviewUrls(newPreviews);
    }

    setLocalSteps(updated);
    notifyChange(updated);
  };

  const updateStepDescription = (index: number, description: string) => {
    const updated = [...localSteps];
    updated[index] = { ...updated[index], description };
    setLocalSteps(updated);
    notifyChange(updated);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Create new steps with pending files
    const newSteps: RecipeStep[] = filesArray.map((file, i) => ({
      step_order: localSteps.length + i,
      image_path: null,
      description: '',
      isNew: true,
      pendingFile: file
    }));

    // Create preview URLs
    const newPreviews = new Map(previewUrls);
    filesArray.forEach((file, i) => {
      const stepIndex = localSteps.length + i;
      newPreviews.set(stepIndex, URL.createObjectURL(file));
    });
    setPreviewUrls(newPreviews);

    const updated = [...localSteps, ...newSteps];
    setLocalSteps(updated);
    notifyChange(updated);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSingleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Revoke old preview URL if exists
    const oldPreview = previewUrls.get(index);
    if (oldPreview) {
      URL.revokeObjectURL(oldPreview);
    }

    // Create new preview URL
    const newPreviews = new Map(previewUrls);
    newPreviews.set(index, URL.createObjectURL(file));
    setPreviewUrls(newPreviews);

    // Update step with pending file
    const updated = [...localSteps];
    updated[index] = { ...updated[index], pendingFile: file };
    setLocalSteps(updated);
    notifyChange(updated);
  };

  const notifyChange = (steps: RecipeStep[]) => {
    // Extract pending uploads for parent component
    const pendingUploads: PendingStepUpload[] = steps
      .map((step, index) => step.pendingFile ? { stepIndex: index, file: step.pendingFile } : null)
      .filter((upload): upload is PendingStepUpload => upload !== null);

    onChange(steps, pendingUploads);
  };

  const removeStepImage = (index: number) => {
    // Revoke preview URL if exists
    const previewUrl = previewUrls.get(index);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      const newPreviews = new Map(previewUrls);
      newPreviews.delete(index);
      setPreviewUrls(newPreviews);
    }

    // Clear image from step
    updateStepImage(index, '');
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
            className="px-4 py-2 bg-[#7A9D7E] text-white rounded-md hover:bg-[#6B8A6E] flex items-center text-sm"
          >
            <FaImages className="mr-2" />
            Bulk Upload Images
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

      <div className="p-3 text-sm border-l-4 border-blue-400 rounded bg-blue-50 text-blue-700">
        <p className="font-medium">💡 Images will upload when you click &quot;Save Recipe&quot;</p>
        <p className="mt-1 text-xs">You can preview and organize your steps before uploading.</p>
      </div>

      {localSteps.length === 0 ? (
        <div className="py-8 text-center border-2 border-gray-300 border-dashed rounded-lg">
          <FaImages className="mx-auto mb-3 text-4xl text-gray-400" />
          <p className="mb-2 font-medium text-gray-500">No steps added yet</p>
          <p className="mb-4 text-sm text-gray-400">Upload multiple images at once or add steps one by one</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#7A9D7E] text-white rounded-md hover:bg-[#6B8A6E] flex items-center"
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
          {localSteps.map((step, index) => {
            const previewUrl = previewUrls.get(index);
            const hasImage = step.image_path || previewUrl;

            return (
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
                    {step.pendingFile && (
                      <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded">
                        📎 Ready to upload
                      </span>
                    )}
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
                      className="p-2 text-red-600 rounded hover:bg-red-50"
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
                  {hasImage ? (
                    <div className="relative">
                      <div className="w-full h-64 overflow-hidden bg-gray-100 rounded-lg">
                        {previewUrl ? (
                          // Show local preview
                          <Image
                            src={previewUrl}
                            alt={`Step ${index + 1} preview`}
                            width={400}
                            height={256}
                            className="object-cover w-full h-full"
                          />
                        ) : step.image_path ? (
                          // Show uploaded image
                          (() => {
                            const parsed = parseSupabaseUrl(step.image_path);
                            if (!parsed) return null;
                            return (
                              <SecureImage
                                bucket={parsed.bucket}
                                path={parsed.path}
                                alt={`Step ${index + 1}`}
                                width={400}
                                height={256}
                                className="object-cover w-full h-full"
                              />
                            );
                          })()
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStepImage(index)}
                        className="absolute p-2 text-white bg-red-500 rounded-full top-2 right-2 hover:bg-red-600"
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
                        <FaPlus className="mb-2 text-3xl text-gray-400" />
                        <span className="text-sm text-gray-600">Upload Step Image</span>
                        <span className="mt-1 text-xs text-gray-500">Click to browse</span>
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
                  <p className="mt-1 text-xs text-gray-500">
                    Describe what the user should do in this step
                  </p>
                </div>
              </div>
            );
          })}
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
