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
  // Recipes
  RECIPE_IMAGES: 'images/recipes/',
  RECIPE_STEPS: 'images/recipes/steps/',

  // Vlogs
  VLOG_THUMBNAILS: 'thumbnails/vlogs/',
  VLOG_ALBUM_IMAGES: 'images/vlogs/albums/',

  // Storefront
  STOREFRONT_CATEGORY_IMAGES: 'images/storefront/categories/',
  STOREFRONT_PRODUCT_IMAGES: 'images/storefront/products/',

  // Healing
  HEALING_PRODUCT_IMAGES: 'images/healing/products/',
  HEALING_ALBUM_IMAGES: 'images/healing/albums/',

  // Home Page
  HOME_VIDEOS: 'videos/home/',
  HOME_IMAGES: 'images/home/',

} as const; // "as const" makes it readonly and improves autocompletion

// Type helper to extract the values from STORAGE_PATHS
export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
