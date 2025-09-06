import { supabase } from './client';
import { seedProducts, categories as seedCategories } from '../../data/storefrontData';

// Types matching Supabase schema
export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  status: 'draft' | 'published' | 'archived';
  is_favorite: boolean;
  tags: string[];
  amazon_url: string;
  created_at: string;
  updated_at: string;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StorefrontFavorite {
  id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product?: StorefrontProduct;
}

class StorefrontSupabaseService {
  // Categories
  async getCategories(): Promise<StorefrontCategory[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      // If no categories in production, return seed data in development
      if (!data?.length && process.env.NODE_ENV === 'development') {
        return seedCategories.map((cat, i) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          image_url: cat.tileImage,
          sort_order: i,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Products
  async getPublishedProducts(): Promise<StorefrontProduct[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_products')
        .select('*')
        .eq('status', 'published')
        .order('name');

      if (error) throw error;

      // Return seed data in development if no products
      if (!data?.length && process.env.NODE_ENV === 'development') {
        return seedProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: p.tagline || '',
          price: p.price,
          image_url: p.image,
          category_id: p.category,
          status: 'published',
          is_favorite: p.featured || false,
          tags: p.tags || [],
          amazon_url: p.link,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching published products:', error);
      throw error;
    }
  }

  async getProductsByCategory(categoryId: string): Promise<StorefrontProduct[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .order('name');

      if (error) throw error;

      // Return filtered seed data in development
      if (!data?.length && process.env.NODE_ENV === 'development') {
        return seedProducts
          .filter(p => p.category === categoryId)
          .map(p => ({
            id: p.id,
            name: p.name,
            slug: p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: p.tagline || '',
            price: p.price,
            image_url: p.image,
            category_id: p.category,
            status: 'published',
            is_favorite: p.featured || false,
            tags: p.tags || [],
            amazon_url: p.link,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  async getFavoriteProducts(): Promise<StorefrontProduct[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_favorites')
        .select('*, product:storefront_products(*)')
        .order('sort_order');

      if (error) throw error;

      // Return featured seed data in development
      if (!data?.length && process.env.NODE_ENV === 'development') {
        return seedProducts
          .filter(p => p.featured)
          .map(p => ({
            id: p.id,
            name: p.name,
            slug: p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: p.tagline || '',
            price: p.price,
            image_url: p.image,
            category_id: p.category,
            status: 'published',
            is_favorite: true,
            tags: p.tags || [],
            amazon_url: p.link,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
      }

      return data?.map(fav => fav.product) || [];
    } catch (error) {
      console.error('Error fetching favorite products:', error);
      throw error;
    }
  }

  async findProductBySlug(slug: string): Promise<StorefrontProduct | null> {
    try {
      const { data, error } = await supabase
        .from('storefront_products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Try to find in seed data if in development
      if (!data && process.env.NODE_ENV === 'development') {
        const seedProduct = seedProducts.find(p => 
          p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
        );
        if (seedProduct) {
          return {
            id: seedProduct.id,
            name: seedProduct.name,
            slug,
            description: seedProduct.tagline || '',
            price: seedProduct.price,
            image_url: seedProduct.image,
            category_id: seedProduct.category,
            status: 'published',
            is_favorite: seedProduct.featured || false,
            tags: seedProduct.tags || [],
            amazon_url: seedProduct.link,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      return data;
    } catch (error) {
      console.error('Error finding product by slug:', error);
      throw error;
    }
  }

  // Development helper to seed data
  async seedData() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Seeding only allowed in development');
      return;
    }

    try {
      // Seed categories
      const { error: catError } = await supabase
        .from('storefront_categories')
        .upsert(
          seedCategories.map((cat, i) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            image_url: cat.tileImage,
            sort_order: i
          }))
        );

      if (catError) throw catError;

      // Seed products
      const { error: prodError } = await supabase
        .from('storefront_products')
        .upsert(
          seedProducts.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: p.tagline || '',
            price: p.price,
            image_url: p.image,
            category_id: p.category,
            status: 'published',
            is_favorite: p.featured || false,
            tags: p.tags || [],
            amazon_url: p.link
          }))
        );

      if (prodError) throw prodError;

      // Seed favorites
      const favorites = seedProducts
        .filter(p => p.featured)
        .map((p, i) => ({
          product_id: p.id,
          sort_order: i
        }));

      const { error: favError } = await supabase
        .from('storefront_favorites')
        .upsert(favorites);

      if (favError) throw favError;

      console.log('Successfully seeded storefront data');
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
}

export const storefrontSupabase = new StorefrontSupabaseService();
export default storefrontSupabase;
