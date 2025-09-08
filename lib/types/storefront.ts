import { z } from 'zod';

// Schema-aligned types that match CURRENT_SCHEMA.md exactly

export const StorefrontStatusSchema = z.enum(['draft', 'published', 'archived']);
export type StorefrontStatus = z.infer<typeof StorefrontStatusSchema>;

export const StorefrontCategorySchema = z.enum(['Food', 'Healing', 'Home', 'Personal Care']);
export type StorefrontCategory = z.infer<typeof StorefrontCategorySchema>;

// Schema-correct StorefrontProduct type matching database columns exactly
export interface StorefrontProduct {
  id: string;
  product_title: string;
  slug: string;
  category_name: StorefrontCategory;
  status: StorefrontStatus;
  sortWeight: number;
  amazon_url: string;
  price: number | null;
  product_image_path: string;
  noteShort: string | null;
  noteLong: string | null;
  tags: string[];
  isAlexisPick: boolean;
  is_favorite: boolean;
  showInFavorites: boolean;
  created_at: string;
  updated_at: string;
}

// Zod validation schema for product form input
export const StorefrontProductFormSchema = z.object({
  product_title: z.string().min(2, 'Product title must be at least 2 characters').max(120, 'Title too long (max 120)'),
  slug: z.string().optional(),
  category_name: StorefrontCategorySchema,
  status: StorefrontStatusSchema.default('draft'),
  sortWeight: z.number().int().min(0).default(0),
  amazon_url: z.string().url('Must be a valid HTTPS URL').refine((url) => url.startsWith('https://'), {
    message: 'Amazon URL must start with https://'
  }),
  price: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (!val || (typeof val === 'string' && val.trim() === '')) return null;
    const num = Number(val);
    return isFinite(num) ? num : null;
  }),
  product_image_path: z.string().min(1, 'Product image is required'),
  noteShort: z.string().optional().nullable(),
  noteLong: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isAlexisPick: z.boolean().default(false),
  is_favorite: z.boolean().default(false),
  showInFavorites: z.boolean().default(false),
});

export type StorefrontProductFormInput = z.input<typeof StorefrontProductFormSchema>;
export type StorefrontProductFormData = z.infer<typeof StorefrontProductFormSchema>;

// Database insert/update payload type
export interface StorefrontProductPayload {
  product_title: string;
  slug: string;
  category_name: StorefrontCategory;
  status: StorefrontStatus;
  sortWeight: number;
  amazon_url: string;
  price: number | null;
  product_image_path: string;
  noteShort: string | null;
  noteLong: string | null;
  tags: string[];
  isAlexisPick: boolean;
  is_favorite: boolean;
  showInFavorites: boolean;
}

// Stats interface
export interface StorefrontStats {
  total: number;
  byStatus: Record<StorefrontStatus, number>;
  byCategory: Record<string, number>;
  favorites: number;
}

// Category type for the select dropdown
export interface StorefrontCategoryOption {
  category_name: string;
  category_description: string | null;
  category_image_path: string | null;
  is_featured: boolean;
}