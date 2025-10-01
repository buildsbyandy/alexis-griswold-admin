import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import type { Recipe, RecipeStatus, RecipeFolder } from '../../lib/services/recipeService';
import recipeService from '../../lib/services/recipeService';
import { findCarouselByPageSlug, getCarouselItems } from '../../lib/services/carouselService';
import toast from 'react-hot-toast';
import RecipeStepsBuilder, { type RecipeStep } from '../recipe/RecipeStepsBuilder';

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
    prepTime: '',
    cookTime: '',
    servings: 1,
    difficulty: 'Easy' as RecipeDifficulty,
    tags: [] as string[],
  });

  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);

  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [folders, setFolders] = useState<RecipeFolder[]>([]);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      const foldersList = await recipeService.getAllFolders();
      setFolders(foldersList);
    };
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

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
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: isValidDifficulty(recipe.difficulty) ? recipe.difficulty : 'Easy',
        tags: recipe.tags,
      });

      // Load recipe steps if editing existing recipe
      if (recipe.id) {
        loadRecipeSteps(recipe.id);
      }
    } else {
      // Reset form for new recipe - use first folder as default
      const defaultFolder = folders.length > 0 ? folders[0].slug : '';
      setFormData({
        title: '',
        slug: '',
        description: '',
        category: '',
        folder_slug: defaultFolder,
        is_beginner: false,
        is_recipe_of_week: false,
        status: 'published' as RecipeStatus,
        // Legacy is_favorite field removed - featured status managed by carousel system
        hero_image_path: '',
        images: [],
        prepTime: '',
        cookTime: '',
        servings: 1,
        difficulty: 'Easy',
        tags: [],
      });
      setRecipeSteps([]);
    }
    // Always reset the tag input when modal opens/closes
    setNewTag('');
  }, [recipe, isOpen, folders]);

  // Load recipe steps from API
  const loadRecipeSteps = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/steps`);
      if (response.ok) {
        const data = await response.json();
        setRecipeSteps(data.steps || []);
      }
    } catch (error) {
      console.error('Error loading recipe steps:', error);
      setRecipeSteps([]);
    }
  };

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Recipe title is required');
      return;
    }

    // Validate that all steps have descriptions
    const invalidSteps = recipeSteps.filter(step => !step.description?.trim());
    if (invalidSteps.length > 0) {
      toast.error('All recipe steps must have descriptions');
      return;
    }

    // Validate that at least one step exists
    if (recipeSteps.length === 0) {
      toast.error('Please add at least one recipe step');
      return;
    }

    try {
      // Automatically set hero_image_path from first step
      const heroImagePath = recipeSteps[0]?.image_path || '';

      // Collect all images from steps for the images array
      const allImages = recipeSteps
        .filter(step => step.image_path)
        .map(step => step.image_path as string);

      // Add required timestamp fields for the Recipe interface
      const recipeData = {
        ...formData,
        hero_image_path: heroImagePath,
        images: allImages,
        ingredients: [], // Empty array for legacy field
        instructions: [], // Empty array for legacy field
        is_favorite: false, // Legacy field - will be ignored by API but required by interface
        created_at: recipe ? recipe.created_at : new Date(),
        updated_at: new Date()
      };

      await onSave(recipeData);

      // After recipe is saved, save the steps
      // We need to get the recipe ID - if editing, we have it; if new, we need to fetch it
      let recipeId = recipe?.id;

      if (!recipeId) {
        // For new recipes, fetch the just-created recipe by slug
        const response = await fetch(`/api/recipes?slug=${formData.slug}`);
        if (response.ok) {
          const data = await response.json();
          const foundRecipe = data.recipes?.find((r: any) => r.slug === formData.slug);
          recipeId = foundRecipe?.id;
        }
      }

      if (recipeId) {
        await saveRecipeSteps(recipeId);
      }

      onClose();
      toast.success(`Recipe ${recipe ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error(`Failed to ${recipe ? 'update' : 'create'} recipe`);
    }
  };

  const saveRecipeSteps = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: recipeSteps })
      });

      if (!response.ok) {
        throw new Error('Failed to save recipe steps');
      }
    } catch (error) {
      console.error('Error saving recipe steps:', error);
      throw error;
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

            {/* Recipe Steps Builder - Replaces separate image uploads */}
            <div className="border-t border-gray-200 pt-6">
              <RecipeStepsBuilder
                steps={recipeSteps}
                onChange={setRecipeSteps}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 <strong>Tip:</strong> The first step&apos;s image will automatically be used as the hero image for the recipe card. You can bulk upload multiple images at once!
              </p>
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
                  {folders.length === 0 ? (
                    <option value="">No folders available</option>
                  ) : (
                    folders
                      .filter(folder => folder.is_visible)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                      .map(folder => (
                        <option key={folder.id} value={folder.slug}>
                          {folder.name}
                        </option>
                      ))
                  )}
                </select>
                <p className="text-xs text-gray-600 mt-1">Recipe folder for organization and filtering</p>
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

            {/* Recipe Steps Builder */}
            <div className="border-t border-gray-200 pt-6">
              <RecipeStepsBuilder
                steps={recipeSteps}
                onChange={setRecipeSteps}
              />
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