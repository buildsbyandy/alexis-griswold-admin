import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import type { Recipe, RecipeStatus } from '../../lib/services/recipeService';
import recipeService from '../../lib/services/recipeService';
import { findCarouselByPageSlug, getCarouselItems } from '../../lib/services/carouselService';
import FileUpload from '../ui/FileUpload';
import SecureImage from '../admin/SecureImage';
import { parseSupabaseUrl } from '@/util/imageUrl';
import toast from 'react-hot-toast';
import { STORAGE_PATHS } from '@/lib/constants/storagePaths';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: Recipe | null;
  onSave: (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

const isValidDifficulty = (difficulty: string): difficulty is RecipeDifficulty => {
  return ['Easy', 'Medium', 'Hard'].includes(difficulty);
};

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, recipe, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    folder_slug: 'breakfast',
    is_beginner: false,
    is_recipe_of_week: false,
    status: 'published' as RecipeStatus,
    // Legacy is_favorite field removed - featured status managed by carousel system
    hero_image_path: '',
    images: [] as string[],
    ingredients: [''],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: 1,
    difficulty: 'Easy' as RecipeDifficulty,
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        category: recipe.category,
        folder_slug: recipe.folder_slug,
        is_beginner: recipe.is_beginner,
        is_recipe_of_week: recipe.is_recipe_of_week,
        status: recipe.status || 'published',
        // Legacy is_favorite field removed - featured status managed by carousel system
        hero_image_path: recipe.hero_image_path || '',
        images: recipe.images,
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: isValidDifficulty(recipe.difficulty) ? recipe.difficulty : 'Easy',
        tags: recipe.tags,
      });
    } else {
      // Reset form for new recipe
      setFormData({
        title: '',
        slug: '',
        description: '',
        category: '',
        folder_slug: 'breakfast',
        is_beginner: false,
        is_recipe_of_week: false,
        status: 'published' as RecipeStatus,
        // Legacy is_favorite field removed - featured status managed by carousel system
        hero_image_path: '',
        images: [],
        ingredients: [''],
        instructions: [''],
        prepTime: '',
        cookTime: '',
        servings: 1,
        difficulty: 'Easy',
        tags: [],
      });
    }
    // Always reset the tag input when modal opens/closes
    setNewTag('');
  }, [recipe, isOpen]);

  // Check if current recipe is in favorites carousel
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!recipe?.id || !isOpen) {
        setIsFavorite(false);
        return;
      }

      try {
        setIsCheckingFavorite(true);
        const carousel = await findCarouselByPageSlug('recipes', 'recipes-favorites');
        if (carousel.error || !carousel.data) {
          setIsFavorite(false);
          return;
        }

        const items = await getCarouselItems(carousel.data.id);
        if (items.error || !items.data) {
          setIsFavorite(false);
          return;
        }

        // Check if recipe exists in favorites carousel
        const isFav = items.data.some(item => item.ref_id === recipe.id);
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      } finally {
        setIsCheckingFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [recipe?.id, isOpen]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Recipe title is required');
      return;
    }

    try {
      // Add required timestamp fields for the Recipe interface
      const recipeData = {
        ...formData,
        is_favorite: false, // Legacy field - will be ignored by API but required by interface
        created_at: recipe ? recipe.created_at : new Date(),
        updated_at: new Date()
      };
      await onSave(recipeData);
      onClose();
      toast.success(`Recipe ${recipe ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${recipe ? 'update' : 'create'} recipe`);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-[#383B26]">
              {recipe ? 'Edit Recipe' : 'Add New Recipe'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Recipe Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  placeholder="auto-generated-from-title"
                />
                <p className="text-xs text-gray-600 mt-1">URL-friendly version (auto-generated from title)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md h-24 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                placeholder="Brief description of the recipe (shown in recipe cards and search results)"
              />
              <p className="text-xs text-gray-600 mt-1">2-3 sentences describing what makes this recipe special</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Recipe Image</label>
              <p className="text-xs text-gray-600 mb-3">Main image shown on recipe cards (recommended: 800x600px)</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.hero_image_path ? (
                  <div className="relative">
                    {(() => {
                      const parsedUrl = parseSupabaseUrl(formData.hero_image_path)
                      if (parsedUrl) {
                        return (
                          <SecureImage
                            bucket={parsedUrl.bucket}
                            path={parsedUrl.path}
                            alt="Recipe"
                            width={800}
                            height={192}
                            className="w-full h-48 object-cover rounded"
                          />
                        )
                      } else {
                        return (
                          <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400">Invalid image URL</span>
                          </div>
                        )
                      }
                    })()}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileUpload
                        accept="image/*"
                        uploadType="image"
                        folder={STORAGE_PATHS.RECIPE_IMAGES}
                        onUpload={(url) => setFormData(prev => ({ ...prev, hero_image_path: url }))}
                        className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                      >
                        Change Image
                      </FileUpload>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileUpload
                      accept="image/*"
                      uploadType="image"
                      folder={STORAGE_PATHS.RECIPE_IMAGES}
                      onUpload={(url) => setFormData(prev => ({ ...prev, hero_image_path: url }))}
                      className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                    >
                      Upload Recipe Image
                    </FileUpload>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Images */}
            <div>
              <div className="mb-1">
                <label className="block text-sm font-medium text-[#383B26]">Additional Images</label>
              </div>
              <p className="text-xs text-gray-600 mb-3">Additional photos showing the cooking process, final result, or different angles</p>
              
              {formData.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        {(() => {
                          const parsedUrl = parseSupabaseUrl(imageUrl)
                          if (parsedUrl) {
                            return (
                              <SecureImage
                                bucket={parsedUrl.bucket}
                                path={parsedUrl.path}
                                alt={`Recipe step ${index + 1}`}
                                width={300}
                                height={200}
                                className="w-full h-32 object-cover rounded border"
                              />
                            )
                          } else {
                            return (
                              <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center">
                                <span className="text-gray-400 text-sm">Invalid image URL</span>
                              </div>
                            )
                          }
                        })()}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <FileUpload
                      accept="image/*"
                      uploadType="image"
                      folder={STORAGE_PATHS.RECIPE_IMAGES}
                      onUpload={addImage}
                      className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                    >
                      <FaPlus className="mr-2" />
                      Add Another Image
                    </FileUpload>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">No additional images yet</p>
                  <p className="text-sm text-gray-400 mb-4">Click &quot;Add Image&quot; to upload photos of the cooking process or final result</p>
                  <FileUpload
                    accept="image/*"
                    uploadType="image"
                    folder={STORAGE_PATHS.RECIPE_IMAGES}
                    onUpload={addImage}
                    className="px-6 py-3 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center mx-auto"
                  >
                    <FaPlus className="mr-2" />
                    Upload Additional Image
                  </FileUpload>
                </div>
              )}
            </div>

            {/* Category & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Folder</label>
                <select
                  value={formData.folder_slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, folder_slug: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                  <option value="desserts">Desserts</option>
                  <option value="beverages">Beverages</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">Recipe category for organization and filtering</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as RecipeDifficulty }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Servings</label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                  min="1"
                  placeholder="4"
                />
                <p className="text-xs text-gray-600 mt-1">Number of people this recipe serves</p>
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Prep Time</label>
                <input
                  type="text"
                  value={formData.prepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                  placeholder="e.g., 15 mins"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#383B26] mb-1">Cook Time</label>
                <input
                  type="text"
                  value={formData.cookTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                  placeholder="e.g., 30 mins"
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#383B26]">Ingredients</label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-1" />
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">Include quantities and specify organic/brand preferences when relevant</p>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={index === 0 ? "e.g., 2 cups organic flour" : `Ingredient ${index + 1}`}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#383B26]">Instructions</label>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="px-3 py-1 bg-[#B8A692] text-white rounded text-sm hover:bg-[#A0956C] flex items-center"
                >
                  <FaPlus className="mr-1" />
                  Add Step
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">Clear step-by-step instructions - each step should be one action</p>
              <div className="space-y-3">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#E3D4C2] rounded-full flex items-center justify-center text-sm font-medium text-[#383B26]">
                      {index + 1}
                    </div>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={index === 0 ? "Preheat oven to 350°F and grease a 9x13 baking dish..." : `Step ${index + 1}`}
                      className="flex-1 p-2 border border-gray-300 rounded-md h-20 focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded self-start"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#383B26] mb-1">Tags</label>
              <p className="text-xs text-gray-600 mb-3">Keywords to help users find this recipe (e.g., &quot;gluten-free&quot;, &quot;30-minute&quot;, &quot;comfort food&quot;)</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#E3D4C2] text-[#383B26] rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g., gluten-free, dairy-free, quick"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:border-[#B8A692] focus:ring-1 focus:ring-[#B8A692]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Status and Checkboxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex flex-col">
                <span className="text-sm text-[#383B26] mb-1">Status</span>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as RecipeStatus }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8A692]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={async (e) => {
                    const isChecked = e.target.checked;
                    if (!recipe?.id) return;

                    try {
                      setIsCheckingFavorite(true);

                      // Use the recipeService set_favorite method
                      const success = await recipeService.set_favorite(recipe.id, isChecked);
                      if (!success) throw new Error('Failed to update favorite status');

                      setIsFavorite(isChecked);
                      toast.success(isChecked ? 'Added to Favorites' : 'Removed from Favorites');
                    } catch (error) {
                      toast.error('Failed to update Favorites');
                      console.error('Error toggling favorite:', error);
                      // Revert the checkbox state on error
                      setIsFavorite(!isChecked);
                    } finally {
                      setIsCheckingFavorite(false);
                    }
                  }}
                  disabled={!recipe?.id || isCheckingFavorite}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Favorite</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_beginner}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_beginner: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Beginner Recipe</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_recipe_of_week}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_recipe_of_week: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[#383B26]">Recipe of Week</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#B8A692] text-white rounded-md hover:bg-[#A0956C] flex items-center"
            >
              <FaSave className="mr-2" />
              {recipe ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeModal;