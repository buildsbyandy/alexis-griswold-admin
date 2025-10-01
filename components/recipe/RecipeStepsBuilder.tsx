import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import FileUpload from '../ui/FileUpload';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#383B26]">Recipe Steps</h3>
        <button
          type="button"
          onClick={addStep}
          className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center text-sm"
        >
          <FaPlus className="mr-2" />
          Add Step
        </button>
      </div>

      {localSteps.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No steps added yet</p>
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
          >
            <FaPlus className="mr-2" />
            Add Your First Step
          </button>
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
                <h4 className="text-md font-semibold text-[#383B26]">
                  Step {index + 1}
                </h4>
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
                  Step Image {index === 0 && <span className="text-xs text-gray-500">(Optional)</span>}
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
                  <FileUpload
                    folder={STORAGE_PATHS.RECIPE_STEPS}
                    uploadType="image"
                    onUpload={(path) => updateStepImage(index, path)}
                    accept="image/*"
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#B8A692] bg-gray-50 flex flex-col items-center justify-center"
                  >
                    <FaPlus className="text-3xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Upload Step Image</span>
                    <span className="text-xs text-gray-500 mt-1">Click to browse or drag and drop</span>
                  </FileUpload>
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
