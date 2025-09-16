import type {
  StorefrontProductRow,
  StorefrontProductInsert,
  StorefrontProductUpdate,
  StorefrontCategoryRow,
  StorefrontCategoryInsert,
  StorefrontCategoryUpdate,
  StorefrontFavoriteRow,
  StorefrontFavoriteInsert,
  StorefrontFavoriteUpdate,
  StorefrontStats,
  StorefrontFilters,
  StorefrontSearchOptions,
  StorefrontProductFormData,
  StorefrontCategoryFormData,
  StorefrontFavoriteFormData,
  ContentStatus
} from '@/lib/types/storefront';

class StorefrontService {
  // Products
  async get_storefront_products(options?: StorefrontSearchOptions): Promise<StorefrontProductRow[]> {
    try {
      const params = new URLSearchParams();
      if (options?.query) params.append('query', options.query);
      if (options?.filters?.category_slug) params.append('category_slug', options.filters.category_slug);
      if (options?.filters?.status) params.append('status', options.filters.status);
      if (options?.filters?.is_alexis_pick !== undefined) params.append('is_alexis_pick', String(options.filters.is_alexis_pick));
      if (options?.filters?.is_favorite !== undefined) params.append('is_favorite', String(options.filters.is_favorite));
      if (options?.filters?.show_in_favorites !== undefined) params.append('show_in_favorites', String(options.filters.show_in_favorites));
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
        sort_weight: input.sort_weight || null,
        amazon_url: input.amazon_url,
        price: input.price || null,
        image_path: input.image_path || null,
        image_alt: input.image_alt || null,
        description: input.description || null,
        tags: input.tags || null,
        is_alexis_pick: input.is_alexis_pick || null,
        is_favorite: input.is_favorite || null,
        show_in_favorites: input.show_in_favorites || null,
        // Initialize tracking fields
        click_count: null,
        clicks_30d: null,
        is_top_clicked: null,
        deleted_at: null,
        // Legacy camelCase fields set to null (will be removed from schema eventually)
        imageAlt: null,
        pairsWith: null,
        usedIn: null
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
      if (input.sort_weight !== undefined) dbPayload.sort_weight = input.sort_weight;
      if (input.amazon_url !== undefined) dbPayload.amazon_url = input.amazon_url;
      if (input.price !== undefined) dbPayload.price = input.price;
      if (input.image_path !== undefined) dbPayload.image_path = input.image_path;
      if (input.image_alt !== undefined) dbPayload.image_alt = input.image_alt;
      if (input.description !== undefined) dbPayload.description = input.description;
      if (input.tags !== undefined) dbPayload.tags = input.tags;
      if (input.is_alexis_pick !== undefined) dbPayload.is_alexis_pick = input.is_alexis_pick;
      if (input.is_favorite !== undefined) dbPayload.is_favorite = input.is_favorite;
      if (input.show_in_favorites !== undefined) dbPayload.show_in_favorites = input.show_in_favorites;

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

  // Favorites
  async get_storefront_favorites(): Promise<StorefrontFavoriteRow[]> {
    try {
      const response = await fetch('/api/storefront/favorites');

      if (!response.ok) {
        throw new Error(`Failed to fetch storefront favorites: ${response.statusText}`);
      }

      const data = await response.json();
      return data.favorites || [];
    } catch (error) {
      console.error('Error fetching storefront favorites:', error);
      throw error;
    }
  }

  async create_storefront_favorite(input: StorefrontFavoriteFormData): Promise<StorefrontFavoriteRow> {
    try {
      const dbPayload: StorefrontFavoriteInsert = {
        product_title: input.product_title,
        amazon_url: input.amazon_url,
        product_image_path: input.product_image_path || null,
        favorite_order: input.favorite_order || null,
        tags: input.tags || null,
        product_description: input.product_description || null,
        status: input.status || 'draft',
        category_pill: null,
        click_count: null
      };

      const response = await fetch('/api/storefront/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbPayload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || `Failed to create storefront favorite: ${response.statusText}`);
      }

      const data = await response.json();
      return data.favorite;
    } catch (error) {
      console.error('Error creating storefront favorite:', error);
      throw error;
    }
  }

  // Stats and utilities
  async get_storefront_stats(): Promise<StorefrontStats> {
    try {
      const products = await this.get_storefront_products();

      const stats: StorefrontStats = {
        total: products.length,
        byStatus: {
          draft: 0,
          published: 0,
          archived: 0,
        },
        byCategory: {},
        favorites: 0,
        topClicked: 0,
      };

      for (const product of products) {
        // Count by status
        if (product.status) {
          stats.byStatus[product.status as ContentStatus] = (stats.byStatus[product.status as ContentStatus] || 0) + 1;
        }

        // Count by category
        if (product.category_slug) {
          stats.byCategory[product.category_slug] = (stats.byCategory[product.category_slug] || 0) + 1;
        }

        // Count favorites
        if (product.show_in_favorites && product.status === 'published') {
          stats.favorites++;
        }

        // Count top clicked
        if (product.is_top_clicked) {
          stats.topClicked++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error calculating storefront stats:', error);
      throw error;
    }
  }

  // Utility functions
  generate_slug(product_title: string): string {
    return product_title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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
      sort_weight: product.sort_weight || undefined,
      amazon_url: product.amazon_url,
      price: product.price || undefined,
      image_path: product.image_path || undefined,
      image_alt: product.image_alt || undefined,
      description: product.description || undefined,
      tags: product.tags || undefined,
      is_alexis_pick: product.is_alexis_pick || undefined,
      is_favorite: product.is_favorite || undefined,
      show_in_favorites: product.show_in_favorites || undefined,
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