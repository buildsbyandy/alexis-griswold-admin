/**
 * Database Schema Types
 * 
 * TypeScript interfaces that match the planned Supabase database schema.
 * These interfaces prepare the codebase for database connection without
 * actually connecting yet.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  created_at: string;
}

// ============================================================================
// HOME PAGE CONTENT
// ============================================================================

export interface HomeContent extends BaseRecord {
  // Background Media
  background_video_path?: string;
  background_image_path?: string;
  
  // Hero Content
  hero_main_title: string;
  hero_subtitle: string;
  
  // Footer
  copyright_text: string;
  
  // Meta
  is_published: boolean;
}

export interface NavigationButton extends BaseRecord {
  home_content_id: string;
  button_text: string;
  button_href: string;
  sort_order: number;
  is_active: boolean;
}

// ============================================================================
// VLOGS PAGE CONTENT
// ============================================================================

export interface VlogsPageContent extends BaseRecord {
  // Hero Section
  hero_main_title: string;
  hero_main_subtitle: string;
  hero_body_paragraph: string;
  
  // Featured Video
  hero_youtube_url?: string;
  hero_video_title?: string;
  hero_video_subtitle?: string;
  hero_video_date?: string;
  hero_thumbnail_override?: string;
  
  // Social Links
  youtube_channel_url?: string;
  tiktok_profile_url?: string;
  
  // Meta
  is_published: boolean;
}

export interface VideoCarousel extends BaseRecord {
  vlogs_page_id: string;
  carousel_name: string;
  carousel_subtitle?: string;
  sort_order: number;
  is_active: boolean;
}

export interface CarouselVideo extends BaseRecord {
  carousel_id: string;
  youtube_url: string;
  video_title: string;
  video_description?: string;
  thumbnail_url?: string;
  duration?: string;
  sort_order: number;
  is_featured: boolean;
}

export interface PhotoAlbum extends BaseRecord {
  vlogs_page_id: string;
  album_title: string;
  album_subtitle?: string;
  album_description?: string;
  album_date?: string;
  cover_image_path?: string;
  sort_order: number;
  is_published: boolean;
}

export interface AlbumPhoto extends BaseRecord {
  album_id: string;
  image_path: string;
  photo_caption?: string;
  sort_order: number;
}

export interface SpotifySection extends BaseRecord {
  vlogs_page_id: string;
  section_title: string;
  section_subtitle?: string;
  sort_order: number;
  is_active: boolean;
}

export interface SpotifyPlaylist extends BaseRecord {
  spotify_section_id: string;
  playlist_title: string;
  playlist_body_text?: string;
  mood_pill_text?: string;
  card_color_hex?: string;
  spotify_url: string;
  sort_order: number;
  is_featured: boolean;
}

// ============================================================================
// RECIPES & TUTORIALS PAGE CONTENT
// ============================================================================

export interface RecipesPageContent extends BaseRecord {
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_body_paragraph: string;
  
  // Meta
  is_published: boolean;
}

export interface RecipeHeroCarousel extends BaseRecord {
  recipes_page_id: string;
  youtube_url: string;
  video_title: string;
  sort_order: number;
  is_active: boolean;
}

export interface Recipe extends BaseRecord {
  // Basic Info
  recipe_name: string;
  recipe_description?: string;
  recipe_category: 'breakfast' | 'meals' | 'smoothies' | 'desserts' | 'sauces' | 'raw' | 'juices' | 'drinks';
  recipe_label?: string;
  
  // Content
  ingredients: string[]; // JSON array
  instructions: string[]; // JSON array
  
  // Media
  recipe_images: string[]; // JSON array of image paths
  
  // Classification
  is_beginner_friendly: boolean;
  is_featured: boolean;
  is_published: boolean;
  
  // SEO
  slug: string;
}

export interface RecipeCategory extends BaseRecord {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_description?: string;
  sort_order: number;
  is_active: boolean;
}

// ============================================================================
// HEALING PAGE CONTENT
// ============================================================================

export interface HealingPageContent extends BaseRecord {
  // Hero Section
  hero_header: string;
  hero_subtitle: string;
  hero_body_paragraph: string;
  
  // Hero Video Card
  hero_video_youtube_url?: string;
  hero_video_title?: string;
  hero_video_subtitle?: string;
  hero_video_date?: string;
  
  // Meta
  is_published: boolean;
}

export interface HealingCarousel extends BaseRecord {
  healing_page_id: string;
  carousel_name: string;
  carousel_header: string;
  carousel_subtitle?: string;
  sort_order: number;
  is_active: boolean;
}

export interface HealingVideo extends BaseRecord {
  carousel_id: string;
  youtube_url: string;
  video_title: string;
  video_subtitle?: string;
  thumbnail_url?: string;
  sort_order: number;
  is_featured: boolean;
}

export interface HealingProduct extends BaseRecord {
  healing_page_id: string;
  product_title: string;
  product_purpose: string;
  product_how_to_use: string;
  product_link_url?: string;
  product_image_path?: string;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
}

// ============================================================================
// AMAZON STOREFRONT PAGE CONTENT
// ============================================================================

export interface StorefrontPageContent extends BaseRecord {
  // Page Settings
  page_title?: string;
  page_description?: string;
  
  // Meta
  is_published: boolean;
}

export interface ProductCategory extends BaseRecord {
  category_name: string;
  category_description?: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface StorefrontProduct extends BaseRecord {
  // Basic Info
  product_title: string;
  product_description?: string;
  amazon_url: string;
  
  // Media
  product_image_path?: string;
  
  // Classification
  category_id: string;
  category_pill_text?: string;
  
  // Tracking
  click_count: number;
  last_clicked_at?: string;
  
  // Status
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface FavoritesCarousel extends BaseRecord {
  storefront_page_id: string;
  carousel_title: string;
  sort_order: number;
  is_active: boolean;
}

export interface FavoriteProduct extends BaseRecord {
  carousel_id: string;
  product_id: string;
  sort_order: number;
}

// ============================================================================
// FORM DATA INTERFACES (for admin forms)
// ============================================================================

export interface HomeContentFormData {
  // Background Media
  backgroundVideoPath?: string;
  backgroundImagePath?: string;
  
  // Hero Content
  heroMainTitle: string;
  heroSubtitle: string;
  
  // Navigation Buttons
  navigationButtons: {
    buttonText: string;
    buttonHref: string;
  }[];
  
  // Footer
  copyrightText: string;
  
  // Meta
  isPublished: boolean;
}

export interface VlogFormData {
  // Basic Info
  title: string;
  description?: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  
  // Classification
  type: 'YOUTUBE' | 'PERSONAL' | 'FEATURED';
  isFeatured: boolean;
  isPublished: boolean;
  
  // Metadata
  duration?: string;
  tags: string[];
  publishedAt?: string;
}

export interface PhotoAlbumFormData {
  // Basic Info
  albumTitle: string;
  albumSubtitle?: string;
  albumDescription?: string;
  albumDate?: string;
  
  // Media
  coverImagePath?: string;
  photos: {
    imagePath: string;
    photoCaption?: string;
  }[];
  
  // Meta
  isPublished: boolean;
}

export interface RecipeFormData {
  // Basic Info
  recipeName: string;
  recipeDescription?: string;
  recipeCategory: Recipe['recipe_category'];
  recipeLabel?: string;
  slug: string;
  
  // Content
  ingredients: string[];
  instructions: string[];
  
  // Media
  recipeImages: string[];
  
  // Classification
  isBeginnerFriendly: boolean;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface HealingProductFormData {
  // Basic Info
  productTitle: string;
  productPurpose: string;
  productHowToUse: string;
  productLinkUrl?: string;
  
  // Media
  productImagePath?: string;
  
  // Meta
  isFeatured: boolean;
  isPublished: boolean;
}

export interface StorefrontProductFormData {
  // Basic Info
  productTitle: string;
  productDescription?: string;
  amazonUrl: string;
  
  // Media
  productImagePath?: string;
  
  // Classification
  categoryId: string;
  categoryPillText?: string;
  
  // Status
  isFeatured: boolean;
  isPublished: boolean;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ContentStatus = 'draft' | 'published' | 'archived';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type UploadFolder = 
  | 'home'
  | 'vlogs'
  | 'vlogs/albums'
  | 'recipes'
  | 'healing'
  | 'amazon'
  | 'general';

export interface FileUploadConfig {
  folder: UploadFolder;
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
}

// ============================================================================
// DATABASE OPERATIONS (placeholders for future implementation)
// ============================================================================

export interface DatabaseOperations<T> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: Partial<T>): Promise<T[]>;
  create(data: Omit<T, keyof BaseRecord>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Note: Types are exported via their declarations above; avoid duplicate re-exports.
