/**
 * Form Data Transformers
 * 
 * Transform form data between UI format and database format.
 * Handles arrays, relationships, and data formatting for Supabase.
 */

import type {
  HomeContent,
  VlogsPageContent,
  RecipesPageContent,
  HealingPageContent,
  StorefrontPageContent,
  Recipe,
  PhotoAlbum,
  HealingProduct,
  StorefrontProduct,
  NavigationButton,
  CarouselVideo,
  AlbumPhoto,
  SpotifyPlaylist,
  HomeContentFormData,
  VlogFormData,
  PhotoAlbumFormData,
  RecipeFormData,
  HealingProductFormData,
  StorefrontProductFormData,
} from '../../types/database';

// ============================================================================
// HOME PAGE TRANSFORMERS
// ============================================================================

export class HomeContentTransformer {
  /**
   * Transform form data to database format
   */
  static toDatabase(formData: HomeContentFormData): Omit<HomeContent, 'id' | 'created_at' | 'updated_at'> {
    return {
      background_video_path: formData.backgroundVideoPath || null,
      background_image_path: formData.backgroundImagePath || null,
      hero_main_title: formData.heroMainTitle,
      hero_subtitle: formData.heroSubtitle,
      copyright_text: formData.copyrightText,
      is_published: formData.isPublished,
    };
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: HomeContent): HomeContentFormData {
    return {
      backgroundVideoPath: dbData.background_video_path || '',
      backgroundImagePath: dbData.background_image_path || '',
      heroMainTitle: dbData.hero_main_title,
      heroSubtitle: dbData.hero_subtitle,
      copyrightText: dbData.copyright_text,
      navigationButtons: [], // Will be populated from separate NavigationButton records
      isPublished: dbData.is_published,
    };
  }

  /**
   * Transform navigation buttons form data to database format
   */
  static navigationButtonsToDatabase(
    formData: HomeContentFormData,
    homeContentId: string
  ): Omit<NavigationButton, 'id' | 'created_at' | 'updated_at'>[] {
    return formData.navigationButtons.map((button, index) => ({
      home_content_id: homeContentId,
      button_text: button.buttonText,
      button_href: button.buttonHref,
      sort_order: index + 1,
      is_active: true,
    }));
  }
}

// ============================================================================
// VLOGS PAGE TRANSFORMERS
// ============================================================================

export class VlogTransformer {
  /**
   * Transform vlog form data to database format
   */
  static toDatabase(formData: VlogFormData): Omit<CarouselVideo, 'id' | 'created_at' | 'updated_at' | 'carousel_id'> {
    return {
      carousel_id: '', // Will be set when creating
      youtube_url: formData.youtubeUrl,
      video_title: formData.title,
      video_description: formData.description || null,
      thumbnail_url: formData.thumbnailUrl || null,
      duration: formData.duration || null,
      sort_order: 1, // Will be calculated
      is_featured: formData.isFeatured,
    };
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: CarouselVideo): VlogFormData {
    return {
      title: dbData.video_title,
      description: dbData.video_description || '',
      youtubeUrl: dbData.youtube_url,
      thumbnailUrl: dbData.thumbnail_url || '',
      type: dbData.is_featured ? 'FEATURED' : 'YOUTUBE',
      isFeatured: dbData.is_featured,
      isPublished: true, // Assuming published if in database
      duration: dbData.duration || '',
      views: 0, // Not stored in database yet
      tags: [], // Not implemented yet
      publishedAt: '', // Not implemented yet
    };
  }

  /**
   * Extract YouTube video ID from URL
   */
  static extractYouTubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Generate thumbnail URL from YouTube URL
   */
  static generateThumbnailUrl(youtubeUrl: string): string | null {
    const videoId = this.extractYouTubeId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  }
}

export class PhotoAlbumTransformer {
  /**
   * Transform photo album form data to database format
   */
  static toDatabase(formData: PhotoAlbumFormData): Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at' | 'vlogs_page_id'> {
    return {
      vlogs_page_id: '', // Will be set when creating
      album_title: formData.albumTitle,
      album_subtitle: formData.albumSubtitle || null,
      album_description: formData.albumDescription || null,
      album_date: formData.albumDate || null,
      cover_image_path: formData.coverImagePath || null,
      sort_order: 1, // Will be calculated
      is_published: formData.isPublished,
    };
  }

  /**
   * Transform photos array to database format
   */
  static photosToDatabase(
    formData: PhotoAlbumFormData,
    albumId: string
  ): Omit<AlbumPhoto, 'id' | 'created_at' | 'updated_at'>[] {
    return formData.photos.map((photo, index) => ({
      album_id: albumId,
      image_path: photo.imagePath,
      photo_caption: photo.photoCaption || null,
      sort_order: index + 1,
    }));
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: PhotoAlbum, photos: AlbumPhoto[]): PhotoAlbumFormData {
    return {
      albumTitle: dbData.album_title,
      albumSubtitle: dbData.album_subtitle || '',
      albumDescription: dbData.album_description || '',
      albumDate: dbData.album_date || '',
      coverImagePath: dbData.cover_image_path || '',
      photos: photos.map(photo => ({
        imagePath: photo.image_path,
        photoCaption: photo.photo_caption || '',
      })),
      isPublished: dbData.is_published,
    };
  }
}

// ============================================================================
// RECIPES PAGE TRANSFORMERS
// ============================================================================

export class RecipeTransformer {
  /**
   * Transform recipe form data to database format
   */
  static toDatabase(formData: RecipeFormData): Omit<Recipe, 'id' | 'created_at' | 'updated_at'> {
    return {
      recipe_name: formData.recipeName,
      recipe_description: formData.recipeDescription || null,
      recipe_category: formData.recipeCategory,
      recipe_label: formData.recipeLabel || null,
      ingredients: formData.ingredients,
      instructions: formData.instructions,
      recipe_images: formData.recipeImages,
      is_beginner_friendly: formData.isBeginnerFriendly,
      is_featured: formData.isFeatured,
      is_published: formData.isPublished,
      slug: formData.slug,
    };
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: Recipe): RecipeFormData {
    return {
      recipeName: dbData.recipe_name,
      recipeDescription: dbData.recipe_description || '',
      recipeCategory: dbData.recipe_category,
      recipeLabel: dbData.recipe_label || '',
      slug: dbData.slug,
      ingredients: dbData.ingredients,
      instructions: dbData.instructions,
      recipeImages: dbData.recipe_images,
      isBeginnerFriendly: dbData.is_beginner_friendly,
      isFeatured: dbData.is_featured,
      isPublished: dbData.is_published,
    };
  }

  /**
   * Generate slug from recipe name
   */
  static generateSlug(recipeName: string): string {
    return recipeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Validate ingredients array
   */
  static validateIngredients(ingredients: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    }

    ingredients.forEach((ingredient, index) => {
      if (!ingredient.trim()) {
        errors.push(`Ingredient ${index + 1} cannot be empty`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate instructions array
   */
  static validateInstructions(instructions: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (instructions.length === 0) {
      errors.push('At least one instruction is required');
    }

    instructions.forEach((instruction, index) => {
      if (!instruction.trim()) {
        errors.push(`Instruction ${index + 1} cannot be empty`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}

// ============================================================================
// HEALING PAGE TRANSFORMERS
// ============================================================================

export class HealingProductTransformer {
  /**
   * Transform healing product form data to database format
   */
  static toDatabase(formData: HealingProductFormData): Omit<HealingProduct, 'id' | 'created_at' | 'updated_at' | 'healing_page_id'> {
    return {
      healing_page_id: '', // Will be set when creating
      product_title: formData.productTitle,
      product_purpose: formData.productPurpose,
      product_how_to_use: formData.productHowToUse,
      product_link_url: formData.productLinkUrl || null,
      product_image_path: formData.productImagePath || null,
      sort_order: 1, // Will be calculated
      is_featured: formData.isFeatured,
      is_published: formData.isPublished,
    };
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: HealingProduct): HealingProductFormData {
    return {
      productTitle: dbData.product_title,
      productPurpose: dbData.product_purpose,
      productHowToUse: dbData.product_how_to_use,
      productLinkUrl: dbData.product_link_url || '',
      productImagePath: dbData.product_image_path || '',
      isFeatured: dbData.is_featured,
      isPublished: dbData.is_published,
    };
  }
}

// ============================================================================
// STOREFRONT PAGE TRANSFORMERS
// ============================================================================

export class StorefrontProductTransformer {
  /**
   * Transform storefront product form data to database format
   */
  static toDatabase(formData: StorefrontProductFormData): Omit<StorefrontProduct, 'id' | 'created_at' | 'updated_at' | 'click_count' | 'last_clicked_at'> {
    return {
      product_title: formData.productTitle,
      product_description: formData.productDescription || null,
      amazon_url: formData.amazonUrl,
      product_image_path: formData.productImagePath || null,
      category_id: formData.categoryId,
      category_pill_text: formData.categoryPillText || null,
      click_count: 0,
      last_clicked_at: null,
      is_featured: formData.isFeatured,
      is_published: formData.isPublished,
      sort_order: 1, // Will be calculated
    };
  }

  /**
   * Transform database data to form format
   */
  static toForm(dbData: StorefrontProduct): StorefrontProductFormData {
    return {
      productTitle: dbData.product_title,
      productDescription: dbData.product_description || '',
      amazonUrl: dbData.amazon_url,
      productImagePath: dbData.product_image_path || '',
      categoryId: dbData.category_id,
      categoryPillText: dbData.category_pill_text || '',
      isFeatured: dbData.is_featured,
      isPublished: dbData.is_published,
    };
  }

  /**
   * Validate Amazon URL
   */
  static validateAmazonUrl(url: string): { isValid: boolean; error?: string } {
    const amazonUrlPattern = /^https:\/\/(www\.)?amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp)\/.*$/;
    
    if (!amazonUrlPattern.test(url)) {
      return {
        isValid: false,
        error: 'Please enter a valid Amazon URL',
      };
    }

    return { isValid: true };
  }
}

// ============================================================================
// ARRAY FIELD HELPERS
// ============================================================================

export class ArrayFieldHelper {
  /**
   * Add item to array field
   */
  static addItem<T>(array: T[], newItem: T): T[] {
    return [...array, newItem];
  }

  /**
   * Remove item from array field by index
   */
  static removeItem<T>(array: T[], index: number): T[] {
    return array.filter((_, i) => i !== index);
  }

  /**
   * Update item in array field by index
   */
  static updateItem<T>(array: T[], index: number, updatedItem: T): T[] {
    return array.map((item, i) => (i === index ? updatedItem : item));
  }

  /**
   * Reorder array items
   */
  static reorderItems<T>(array: T[], fromIndex: number, toIndex: number): T[] {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  }

  /**
   * Clean empty items from array
   */
  static cleanEmptyItems(array: string[]): string[] {
    return array.filter(item => item.trim() !== '');
  }
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export class FormValidationHelper {
  /**
   * Validate required fields
   */
  static validateRequired(fields: Record<string, any>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    Object.entries(fields).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        errors[key] = `${key} is required`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate URL fields
   */
  static validateUrls(urls: Record<string, string>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const urlPattern = /^https?:\/\/.+/;

    Object.entries(urls).forEach(([key, value]) => {
      if (value && !urlPattern.test(value)) {
        errors[key] = `${key} must be a valid URL`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate array fields
   */
  static validateArrays(arrays: Record<string, any[]>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    Object.entries(arrays).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        errors[key] = `${key} must be an array`;
      } else if (value.length === 0) {
        errors[key] = `${key} must have at least one item`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  HomeContentTransformer,
  VlogTransformer,
  PhotoAlbumTransformer,
  RecipeTransformer,
  HealingProductTransformer,
  StorefrontProductTransformer,
  ArrayFieldHelper,
  FormValidationHelper,
};
