/**
 * Form Validation Utilities for React Hook Form
 * 
 * Provides validation rules and helpers for consistent form validation
 * across all admin forms with character limits.
 */

import { RegisterOptions, FieldValues, Path } from 'react-hook-form';
import { CONTENT_TYPE_LIMITS, validateLength } from './characterLimits';

/**
 * Create validation rules for React Hook Form
 */
export const createValidationRules = (
  contentType: keyof typeof CONTENT_TYPE_LIMITS,
  options: {
    required?: boolean;
    requiredMessage?: string;
  } = {}
): RegisterOptions => {
  const limit = CONTENT_TYPE_LIMITS[contentType];
  const { required = false, requiredMessage = 'This field is required' } = options;

  const rules: RegisterOptions = {
    maxLength: {
      value: limit,
      message: `Must be ${limit} characters or less`
    },
    validate: {
      characterLimit: (value: string) => {
        if (!value) return true; // Let required handle empty values
        return validateLength(value, limit) || `Must be ${limit} characters or less`;
      }
    }
  };

  if (required) {
    rules.required = requiredMessage;
  }

  return rules;
};

/**
 * Validation rules for specific content types
 */
export const validationRules = {
  // Home page validation rules
  home: {
    heroTitle: createValidationRules('home.hero.title', { required: true }),
    heroSubtitle: createValidationRules('home.hero.subtitle', { required: true }),
    copyright: createValidationRules('home.copyright', { required: true }),
    navigationButton: createValidationRules('home.navigation.button', { required: true }),
  },

  // Vlogs page validation rules
  vlogs: {
    heroMainTitle: createValidationRules('vlogs.hero.mainTitle', { required: true }),
    heroMainSubtitle: createValidationRules('vlogs.hero.mainSubtitle', { required: true }),
    heroBodyParagraph: createValidationRules('vlogs.hero.bodyParagraph', { required: true }),
    heroVideoTitle: createValidationRules('vlogs.hero.videoTitle', { required: true }),
    heroVideoSubtitle: createValidationRules('vlogs.hero.videoSubtitle'),
    videoTitle: createValidationRules('vlogs.video.title', { required: true }),
    videoDescription: createValidationRules('vlogs.video.description'),
    albumTitle: createValidationRules('vlogs.album.title', { required: true }),
    albumDescription: createValidationRules('vlogs.album.description'),
    photoCaption: createValidationRules('vlogs.photo.caption'),
    spotifyTitle: createValidationRules('vlogs.spotify.title', { required: true }),
    spotifySubtitle: createValidationRules('vlogs.spotify.subtitle'),
    playlistTitle: createValidationRules('vlogs.playlist.title', { required: true }),
    playlistBodyText: createValidationRules('vlogs.playlist.bodyText'),
    playlistMoodPill: createValidationRules('vlogs.playlist.moodPill'),
  },

  // Recipes page validation rules
  recipes: {
    heroTitle: createValidationRules('recipes.hero.title', { required: true }),
    heroSubtitle: createValidationRules('recipes.hero.subtitle', { required: true }),
    heroBodyParagraph: createValidationRules('recipes.hero.bodyParagraph', { required: true }),
    videoTitle: createValidationRules('recipes.video.title', { required: true }),
    recipeName: createValidationRules('recipes.recipe.name', { required: true }),
    recipeDescription: createValidationRules('recipes.recipe.description'),
    recipeIngredient: createValidationRules('recipes.recipe.ingredient', { required: true }),
    recipeInstruction: createValidationRules('recipes.recipe.instruction', { required: true }),
    recipeCategory: createValidationRules('recipes.recipe.category', { required: true }),
    sectionTitle: createValidationRules('recipes.section.title', { required: true }),
    sectionSubtitle: createValidationRules('recipes.section.subtitle'),
  },

  // Healing page validation rules
  healing: {
    heroHeader: createValidationRules('healing.hero.header', { required: true }),
    heroSubtitle: createValidationRules('healing.hero.subtitle', { required: true }),
    heroBodyParagraph: createValidationRules('healing.hero.bodyParagraph', { required: true }),
    heroVideoTitle: createValidationRules('healing.hero.videoTitle', { required: true }),
    heroVideoSubtitle: createValidationRules('healing.hero.videoSubtitle'),
    carouselHeader: createValidationRules('healing.carousel.header', { required: true }),
    carouselSubtitle: createValidationRules('healing.carousel.subtitle'),
    videoTitle: createValidationRules('healing.video.title', { required: true }),
    videoSubtitle: createValidationRules('healing.video.subtitle'),
    productTitle: createValidationRules('healing.product.title', { required: true }),
    productPurpose: createValidationRules('healing.product.purpose', { required: true }),
    productHowToUse: createValidationRules('healing.product.howToUse', { required: true }),
  },

  // Storefront page validation rules
  storefront: {
    productTitle: createValidationRules('storefront.product.title', { required: true }),
    productDescription: createValidationRules('storefront.product.description'),
    categoryPill: createValidationRules('storefront.category.pill', { required: true }),
    categoryName: createValidationRules('storefront.category.name', { required: true }),
    categoryDescription: createValidationRules('storefront.category.description'),
  },
} as const;

/**
 * Get character limit for a specific content type
 */
export const getLimit = (contentType: keyof typeof CONTENT_TYPE_LIMITS): number => {
  return CONTENT_TYPE_LIMITS[contentType];
};

/**
 * Custom validation hook for character limits
 */
export const useCharacterValidation = () => {
  const validateCharacterLimit = (
    value: string,
    contentType: keyof typeof CONTENT_TYPE_LIMITS
  ): string | boolean => {
    const limit = CONTENT_TYPE_LIMITS[contentType];
    
    if (!value) return true; // Allow empty values
    
    if (value.length > limit) {
      return `Must be ${limit} characters or less (currently ${value.length})`;
    }
    
    return true;
  };

  const getCharacterInfo = (value: string, contentType: keyof typeof CONTENT_TYPE_LIMITS) => {
    const limit = CONTENT_TYPE_LIMITS[contentType];
    const count = value?.length || 0;
    const remaining = Math.max(0, limit - count);
    const percentage = (count / limit) * 100;
    
    return {
      count,
      limit,
      remaining,
      percentage,
      isOverLimit: count > limit,
      isNearLimit: percentage >= 90,
    };
  };

  return {
    validateCharacterLimit,
    getCharacterInfo,
  };
};

/**
 * Form field configuration with validation
 */
export interface FieldConfig {
  name: string;
  label: string;
  contentType: keyof typeof CONTENT_TYPE_LIMITS;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'url' | 'email';
  rows?: number; // for textarea
}

/**
 * Common field configurations for reuse
 */
export const fieldConfigs = {
  // Vlog form fields
  vlogTitle: {
    name: 'title',
    label: 'Video Title',
    contentType: 'vlogs.video.title' as const,
    required: true,
    placeholder: 'Enter video title...',
  },
  vlogDescription: {
    name: 'description',
    label: 'Description',
    contentType: 'vlogs.video.description' as const,
    type: 'textarea' as const,
    rows: 3,
    placeholder: 'Enter video description...',
  },

  // Recipe form fields
  recipeName: {
    name: 'name',
    label: 'Recipe Name',
    contentType: 'recipes.recipe.name' as const,
    required: true,
    placeholder: 'Enter recipe name...',
  },
  recipeDescription: {
    name: 'description',
    label: 'Description',
    contentType: 'recipes.recipe.description' as const,
    type: 'textarea' as const,
    rows: 4,
    placeholder: 'Describe your recipe...',
  },

  // Product form fields
  productTitle: {
    name: 'title',
    label: 'Product Name',
    contentType: 'healing.product.title' as const,
    required: true,
    placeholder: 'Enter product name...',
  },
  productPurpose: {
    name: 'purpose',
    label: 'Purpose',
    contentType: 'healing.product.purpose' as const,
    required: true,
    type: 'textarea' as const,
    rows: 3,
    placeholder: 'What is this product for?',
  },
  productHowToUse: {
    name: 'howToUse',
    label: 'How to Use',
    contentType: 'healing.product.howToUse' as const,
    required: true,
    type: 'textarea' as const,
    rows: 4,
    placeholder: 'How should this product be used?',
  },
} as const;

export default validationRules;
