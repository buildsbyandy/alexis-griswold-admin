/**
 * Storage Paths Constants
 * Centralized folder paths for Supabase Storage uploads
 *
 * Use these constants instead of raw strings to:
 * - Prevent typos
 * - Get autocompletion
 * - Ensure consistency across the application
 */

export const STORAGE_PATHS = {
  // Recipes - bucket determined by status (published = public, draft/archived = private)
  RECIPE_IMAGES: 'images/recipes',
  RECIPE_STEPS: 'images/recipes',

  // Vlogs - bucket determined by status
  VLOG_THUMBNAILS: 'images/vlogs',
  VLOG_ALBUM_IMAGES: 'images/vlogs',

  // Storefront - bucket determined by status
  STOREFRONT_CATEGORY_IMAGES: 'images/storefront',
  STOREFRONT_PRODUCT_IMAGES: 'images/storefront',

  // Healing - bucket determined by status
  HEALING_PRODUCT_IMAGES: 'images/healing',
  HEALING_ALBUM_IMAGES: 'images/healing',

  // Home Page - always published (public bucket)
  HOME_VIDEOS: 'videos/home',
  HOME_IMAGES: 'images/home',

} as const; // "as const" makes it readonly and improves autocompletion

// Type helper to extract the values from STORAGE_PATHS
export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
