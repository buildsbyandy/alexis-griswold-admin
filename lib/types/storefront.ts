import type { Database } from '@/types/supabase.generated';

// Supabase table type exports for type safety
export type StorefrontProductRow = Database['public']['Tables']['storefront_products']['Row'];
export type StorefrontProductInsert = Database['public']['Tables']['storefront_products']['Insert'];
export type StorefrontProductUpdate = Database['public']['Tables']['storefront_products']['Update'];

export type StorefrontCategoryRow = Database['public']['Tables']['storefront_categories']['Row'];
export type StorefrontCategoryInsert = Database['public']['Tables']['storefront_categories']['Insert'];
export type StorefrontCategoryUpdate = Database['public']['Tables']['storefront_categories']['Update'];


// Enum types
export type ContentStatus = Database['public']['Enums']['content_status'];

// Stats interface for dashboard
export interface StorefrontStats {
  total: number;
  byStatus: Record<ContentStatus, number>;
  byCategory: Record<string, number>;
  favorites: number;
  topClicked: number;
}

// Search/filter interfaces
export interface StorefrontFilters {
  category_slug?: string;
  status?: ContentStatus;
  is_alexis_pick?: boolean;
  is_favorite?: boolean;
}

export interface StorefrontSearchOptions {
  query?: string;
  filters?: StorefrontFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'product_title' | 'click_count' | 'clicks_30d' | 'sort_weight';
  sortOrder?: 'asc' | 'desc';
}

// Form data interface for UI components - matches exact schema fields
export interface StorefrontProductFormData {
  product_title: string;           // Product Title
  slug?: string;                   // Auto-generated from product_title if not provided
  category_slug?: string;          // Category dropdown saves slug
  status: ContentStatus;           // draft/published/archived
  sort_weight?: number;            // Display Order (Top Picks)
  amazon_url: string;              // Amazon URL (required)
  price?: number;                  // Price (optional)
  image_path?: string;             // Product Image path
  image_alt?: string;              // Image alt text (prefer snake_case field)
  description?: string;            // Short description
  tags?: string[];                 // Tags array
  is_alexis_pick?: boolean;        // Alexis' Pick toggle
  is_favorite?: boolean;           // Favorite toggle
}

// Form data interface for categories
export interface StorefrontCategoryFormData {
  category_name: string;           // Category Name
  slug: string;                    // Category slug
  category_description?: string;   // Description
  category_image_path?: string;    // Category Image
  is_featured?: boolean;           // Featured toggle
  is_visible?: boolean;            // Visible toggle
  sort_order?: number;             // Sort order
}

