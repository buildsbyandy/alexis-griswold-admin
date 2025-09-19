import type {
  StorefrontProductRow,
  StorefrontProductInsert,
  StorefrontProductUpdate,
  StorefrontCategoryRow,
  StorefrontCategoryInsert,
  StorefrontCategoryUpdate,
  StorefrontStats,
  StorefrontFilters,
  StorefrontSearchOptions,
  StorefrontProductFormData,
  StorefrontCategoryFormData,
  ContentStatus
} from '@/lib/types/storefront';
import { listStorefrontItems } from '../services/carouselService';
import slugify from '@/lib/utils/slugify';
import supabaseAdmin from '@/lib/supabase';

class StorefrontService {
  // Carousel items (favorites, top-picks)
  async list_favorites(): Promise<Array<{ id: string; ref_id: string; product_title: string | null; image_path: string | null; amazon_url: string | null }>> {
    const res = await listStorefrontItems('favorites')
    if (res.error) throw new Error(res.error)
    return (res.data || []).map(i => ({ id: i.id, ref_id: i.ref_id || '', product_title: i.product_title, image_path: i.image_path, amazon_url: i.amazon_url }))
  }

  async list_top_picks(): Promise<Array<{ id: string; ref_id: string; order_index: number | null; product_title: string | null; image_path: string | null; amazon_url: string | null }>> {
    const res = await listStorefrontItems('top-picks')
    if (res.error) throw new Error(res.error)
    return (res.data || []).map(i => ({ id: i.id, ref_id: i.ref_id || '', order_index: i.order_index ?? 0, product_title: i.product_title, image_path: i.image_path, amazon_url: i.amazon_url }))
  }

  // --- Storefront item mutations (Favorites, Top Picks) ---
  private async fetchItemForProduct(slug: 'favorites' | 'top-picks', productId: string): Promise<{ id: string } | null> {
    const res = await fetch(`/api/storefront/items?slug=${slug}`)
    if (!res.ok) return null
    const data = await res.json()
    const item = (data.items as Array<{ id: string; ref_id: string }> | undefined)?.find(i => i.ref_id === productId)
    return item ? { id: item.id } : null
  }

  async set_favorite(productId: string, on: boolean): Promise<boolean> {
    const existing = await this.fetchItemForProduct('favorites', productId)
    if (on) {
      if (existing) return true
      const res = await fetch('/api/storefront/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, slug: 'favorites' })
      })
      return res.ok
    } else {
      if (!existing) return true
      const res = await fetch(`/api/storefront/items/${existing.id}`, { method: 'DELETE' })
      return res.ok
    }
  }

  async set_top_pick(productId: string, on: boolean, orderIndex?: number): Promise<boolean> {
    const existing = await this.fetchItemForProduct('top-picks', productId)
    if (on) {
      if (!existing) {
        const res = await fetch('/api/storefront/items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, slug: 'top-picks', order_index: orderIndex ?? 0 })
        })
        return res.ok
      }
      if (orderIndex !== undefined) {
        const res = await fetch(`/api/storefront/items/${existing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: orderIndex })
        })
        return res.ok
      }
      return true
    } else {
      if (!existing) return true
      const res = await fetch(`/api/storefront/items/${existing.id}`, { method: 'DELETE' })
      return res.ok
    }
  }

  async update_top_pick_order(productId: string, orderIndex: number): Promise<boolean> {
    const existing = await this.fetchItemForProduct('top-picks', productId)
    if (!existing) return false
    const res = await fetch(`/api/storefront/items/${existing.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_index: orderIndex })
    })
    return res.ok
  }
  // Products
  async get_storefront_products(options?: StorefrontSearchOptions): Promise<StorefrontProductRow[]> {
    try {
      const params = new URLSearchParams();
      if (options?.query) params.append('query', options.query);
      if (options?.filters?.category_slug) params.append('category_slug', options.filters.category_slug);
      if (options?.filters?.status) params.append('status', options.filters.status);
      // Legacy favorite toggles deprecated in favor of carousel items; filters ignored here
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const url = `/api/storefront${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch storefront products: ${response.statusText}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching storefront products:', error);
      throw error;
    }
  }

  async get_storefront_product_by_id(id: string): Promise<StorefrontProductRow | null> {
    try {
      const response = await fetch(`/api/storefront/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch storefront product: ${response.statusText}`);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Error fetching storefront product by ID:', error);
      throw error;
    }
  }

  async create_storefront_product(input: StorefrontProductFormData): Promise<StorefrontProductRow> {
    try {
      // Convert form data to database format
      const dbPayload: StorefrontProductInsert = {
        product_title: input.product_title,
        slug: input.slug || this.generate_slug(input.product_title),
        category_slug: input.category_slug || null,
        status: input.status || 'draft',
        // sort_weight: Removed - now handled by carousel order_index
        amazon_url: input.amazon_url,
        price: input.price || null,
        image_path: input.image_path || null,
        image_alt: input.image_alt || null,
        description: input.description || null,
        tags: input.tags || null,
        // is_alexis_pick: Removed - now handled by carousel system
        // is_favorite: Removed - now handled by carousel system
        // Initialize tracking fields
        click_count: null,
        clicks_30d: null,
        is_top_clicked: null,
        deleted_at: null,
        // Legacy camelCase fields set to null (will be removed from schema eventually)
        imageAlt: null,
        pairs_with: null,
        used_in: null
      };

      const response = await fetch('/api/storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbPayload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to create storefront product: ${response.statusText}`);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Error creating storefront product:', error);
      throw error;
    }
  }

  async update_storefront_product(id: string, input: Partial<StorefrontProductFormData>): Promise<StorefrontProductRow> {
    try {
      // Convert form data to database format, only including defined fields
      const dbPayload: StorefrontProductUpdate = {};

      if (input.product_title !== undefined) dbPayload.product_title = input.product_title;
      if (input.slug !== undefined) dbPayload.slug = input.slug;
      if (input.category_slug !== undefined) dbPayload.category_slug = input.category_slug;
      if (input.status !== undefined) dbPayload.status = input.status;
      // if (input.sort_weight !== undefined) dbPayload.sort_weight = input.sort_weight; // Handled by carousel
      if (input.amazon_url !== undefined) dbPayload.amazon_url = input.amazon_url;
      if (input.price !== undefined) dbPayload.price = input.price;
      if (input.image_path !== undefined) dbPayload.image_path = input.image_path;
      if (input.image_alt !== undefined) dbPayload.image_alt = input.image_alt;
      if (input.description !== undefined) dbPayload.description = input.description;
      if (input.tags !== undefined) dbPayload.tags = input.tags;
      // if (input.is_alexis_pick !== undefined) dbPayload.is_alexis_pick = input.is_alexis_pick; // Handled by carousel
      // if (input.is_favorite !== undefined) dbPayload.is_favorite = input.is_favorite; // Handled by carousel

      const response = await fetch(`/api/storefront/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbPayload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to update storefront product: ${response.statusText}`);
      }

      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Error updating storefront product:', error);
      throw error;
    }
  }

  async delete_storefront_product(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/storefront/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to delete storefront product: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting storefront product:', error);
      throw error;
    }
  }

  // Categories
  async get_storefront_categories(): Promise<StorefrontCategoryRow[]> {
    try {
      const response = await fetch('/api/storefront/categories');

      if (!response.ok) {
        throw new Error(`Failed to fetch storefront categories: ${response.statusText}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching storefront categories:', error);
      throw error;
    }
  }

  async create_storefront_category(input: StorefrontCategoryFormData): Promise<StorefrontCategoryRow> {
    try {
      const dbPayload: StorefrontCategoryInsert = {
        category_name: input.category_name,
        slug: input.slug,
        category_description: input.category_description || null,
        category_image_path: input.category_image_path || null,
        is_featured: input.is_featured || null,
        is_visible: input.is_visible || null,
        sort_order: input.sort_order || null
      };

      const response = await fetch('/api/storefront/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbPayload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to create storefront category: ${response.statusText}`);
      }

      const data = await response.json();
      return data.category;
    } catch (error) {
      console.error('Error creating storefront category:', error);
      throw error;
    }
  }

  async update_storefront_category(id: string, input: Partial<StorefrontCategoryFormData>): Promise<StorefrontCategoryRow> {
    try {
      const dbPayload: StorefrontCategoryUpdate = {};

      if (input.category_name !== undefined) dbPayload.category_name = input.category_name;
      if (input.slug !== undefined) dbPayload.slug = input.slug;
      if (input.category_description !== undefined) dbPayload.category_description = input.category_description;
      if (input.category_image_path !== undefined) dbPayload.category_image_path = input.category_image_path;
      if (input.is_featured !== undefined) dbPayload.is_featured = input.is_featured;
      if (input.is_visible !== undefined) dbPayload.is_visible = input.is_visible;
      if (input.sort_order !== undefined) dbPayload.sort_order = input.sort_order;

      const response = await fetch('/api/storefront/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...dbPayload }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to update storefront category: ${response.statusText}`);
      }

      const data = await response.json();
      return data.category;
    } catch (error) {
      console.error('Error updating storefront category:', error);
      throw error;
    }
  }

  async delete_storefront_category(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/storefront/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to delete storefront category: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting storefront category:', error);
      throw error;
    }
  }


  // Stats and utilities
  async get_storefront_stats(): Promise<StorefrontStats> {
    try {
      // Use direct database access to avoid circular API calls
      const { data: products, error } = await supabaseAdmin
        .from('storefront_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching storefront products directly:', error);
        // Return empty stats instead of throwing
        return {
          total: 0,
          byStatus: { draft: 0, published: 0, archived: 0 },
          byCategory: {},
          favorites: 0,
          topClicked: 0,
        };
      }

      const stats: StorefrontStats = {
        total: products?.length || 0,
        byStatus: {
          draft: 0,
          published: 0,
          archived: 0,
        },
        byCategory: {},
        favorites: 0,
        topClicked: 0,
      };

      for (const product of products || []) {
        // Count by status
        if (product.status) {
          stats.byStatus[product.status as ContentStatus] = (stats.byStatus[product.status as ContentStatus] || 0) + 1;
        }

        // Count by category
        if (product.category_slug) {
          stats.byCategory[product.category_slug] = (stats.byCategory[product.category_slug] || 0) + 1;
        }

        // Count favorites
        // Favorites count now requires items endpoint; keep zero here

        // Count top clicked
        // Leave topClicked aggregation unchanged
      }

      return stats;
    } catch (error) {
      console.error('Error calculating storefront stats:', error);
      throw error;
    }
  }

  // Utility functions
  generate_slug(product_title: string): string {
    return slugify(product_title);
  }

  validate_product_data(data: StorefrontProductFormData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.product_title || data.product_title.trim().length === 0) {
      errors.push('Product title is required');
    }

    if (!data.amazon_url || data.amazon_url.trim().length === 0) {
      errors.push('Amazon URL is required');
    } else if (!data.amazon_url.startsWith('https://')) {
      errors.push('Amazon URL must start with https://');
    }

    if (data.price && (typeof data.price !== 'number' || data.price < 0)) {
      errors.push('Price must be a positive number');
    }

    if (data.product_title && data.product_title.length > 255) {
      errors.push('Product title is too long (max 255 characters)');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description is too long (max 1000 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validate_category_data(data: StorefrontCategoryFormData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.category_name || data.category_name.trim().length === 0) {
      errors.push('Category name is required');
    }

    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('Category slug is required');
    }

    if (data.category_name && data.category_name.length > 100) {
      errors.push('Category name is too long (max 100 characters)');
    }

    if (data.slug && data.slug.length > 100) {
      errors.push('Category slug is too long (max 100 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Convert database row to form data for editing
  product_row_to_form_data(product: StorefrontProductRow): StorefrontProductFormData {
    return {
      product_title: product.product_title,
      slug: product.slug || undefined,
      category_slug: product.category_slug || undefined,
      status: product.status,
      sort_weight: undefined, // Handled by carousel order_index
      amazon_url: product.amazon_url,
      price: product.price || undefined,
      image_path: product.image_path || undefined,
      image_alt: product.image_alt || undefined,
      description: product.description || undefined,
      tags: product.tags || undefined,
      is_alexis_pick: undefined, // Handled by carousel system
      is_favorite: undefined,    // Handled by carousel system
    };
  }

  category_row_to_form_data(category: StorefrontCategoryRow): StorefrontCategoryFormData {
    return {
      category_name: category.category_name,
      slug: category.slug,
      category_description: category.category_description || undefined,
      category_image_path: category.category_image_path || undefined,
      is_featured: category.is_featured || undefined,
      is_visible: category.is_visible || undefined,
      sort_order: category.sort_order || undefined,
    };
  }
}

export const storefrontService = new StorefrontService();
export default storefrontService;