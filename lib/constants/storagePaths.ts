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
  // Recipes (public bucket)
  RECIPE_IMAGES: 'public/images/recipes/',
  RECIPE_STEPS: 'public/images/recipes/',

  // Vlogs (public bucket)
  VLOG_THUMBNAILS: 'public/images/vlogs/',
  VLOG_ALBUM_IMAGES: 'public/images/vlogs/',

  // Storefront (public bucket)
  STOREFRONT_CATEGORY_IMAGES: 'public/images/storefront/',
  STOREFRONT_PRODUCT_IMAGES: 'public/images/storefront/',

  // Healing (public bucket)
  HEALING_PRODUCT_IMAGES: 'public/images/healing/',
  HEALING_ALBUM_IMAGES: 'public/images/healing/',

  // Home Page (public bucket)
  HOME_VIDEOS: 'public/videos/home/',
  HOME_IMAGES: 'public/images/home/',

} as const; // "as const" makes it readonly and improves autocompletion

// Type helper to extract the values from STORAGE_PATHS
export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
