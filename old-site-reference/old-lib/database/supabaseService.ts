/**
 * Supabase Database Service
 * 
 * Real database operations using Supabase client.
 * This replaces the mock database service with actual database calls.
 */

import { supabase, handleSupabaseError } from '../supabase/client'
import type { Database, StorefrontProduct, StorefrontCategory } from '../../types/supabase'
import type {
  HomeContent,
  NavigationButton,
  VlogsPageContent,
  RecipesPageContent,
  HealingPageContent,
  StorefrontPageContent,
  Recipe,
  PhotoAlbum,
  AlbumPhoto,
  HealingProduct,
  CarouselVideo,
  SpotifyPlaylist,
  DatabaseOperations,
  ApiResponse,
} from '../../types/database'

// Type aliases for Supabase types
type SupabaseHomeContent = Database['public']['Tables']['home_content']['Row']
type SupabaseHomeContentInsert = Database['public']['Tables']['home_content']['Insert']
type SupabaseHomeContentUpdate = Database['public']['Tables']['home_content']['Update']
type SupabaseNavigationButtonInsert = Database['public']['Tables']['navigation_buttons']['Insert']

// ============================================================================
// BASE DATABASE OPERATIONS CLASS
// ============================================================================

// Note: Generic database operations are not compatible with Supabase's strict typing.
// Each service below implements operations for specific tables instead.

// ============================================================================
// HOME CONTENT SERVICE
// ============================================================================

export class SupabaseHomeContentService {

  async getHomeContent(): Promise<{
    content: HomeContent | null
    navigationButtons: NavigationButton[]
  }> {
    // Get published home content
    const { data: homeContent, error: homeError } = await supabase
      .from('home_content')
      .select('*')
      .eq('is_published', true)
      .single()

    if (homeError && homeError.code !== 'PGRST116') {
      throw new Error(handleSupabaseError(homeError))
    }

    const content = homeContent as HomeContent | null

    // Get navigation buttons if home content exists
    let navigationButtons: NavigationButton[] = []
    if (content) {
      const { data: navData, error: navError } = await supabase
        .from('navigation_buttons')
        .select('*')
        .eq('home_content_id', content.id)
        .eq('is_active', true)
        .order('sort_order')

      if (navError) {
        throw new Error(handleSupabaseError(navError))
      }

      navigationButtons = (navData as NavigationButton[]) || []
    }

    return { content, navigationButtons }
  }

  async updateHomeContent(
    contentData: Partial<HomeContent>,
    navigationButtons: Omit<NavigationButton, 'id' | 'created_at' | 'updated_at' | 'home_content_id'>[] = []
  ): Promise<HomeContent> {
    // Get or create home content record
    const { data: existingContent } = await supabase
      .from('home_content')
      .select('*')
      .single()

    let homeContent: HomeContent

    if (existingContent) {
      // Update existing content
      const { data: updatedContent, error: updateError } = await supabase
        .from('home_content')
        .update(contentData as SupabaseHomeContentUpdate)
        .eq('id', existingContent.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(handleSupabaseError(updateError))
      }

      homeContent = updatedContent as HomeContent
    } else {
          // Create new content
    const { data: newContent, error: createError } = await supabase
      .from('home_content')
      .insert({
        hero_main_title: contentData.hero_main_title ?? '',
        hero_subtitle: contentData.hero_subtitle ?? '',
        copyright_text: contentData.copyright_text ?? '',
        background_video_path: contentData.background_video_path ?? null,
        background_image_path: contentData.background_image_path ?? null,
        is_published: contentData.is_published ?? true,
      } as SupabaseHomeContentInsert)
      .select()
      .single()

      if (createError) {
        throw new Error(handleSupabaseError(createError))
      }

      homeContent = newContent as HomeContent
    }

    // Update navigation buttons if provided
    if (navigationButtons.length > 0) {
      // Delete existing navigation buttons
      await supabase
        .from('navigation_buttons')
        .delete()
        .eq('home_content_id', homeContent.id)

      // Insert new navigation buttons
      const navButtonsData: SupabaseNavigationButtonInsert[] = navigationButtons.map((btn, index) => ({
        home_content_id: homeContent.id,
        button_text: btn.button_text,
        button_href: btn.button_href,
        sort_order: index + 1,
        is_active: true,
      }))

      const { error: navError } = await supabase
        .from('navigation_buttons')
        .insert(navButtonsData)

      if (navError) {
        throw new Error(handleSupabaseError(navError))
      }
    }

    return homeContent
  }
}

// ============================================================================
// RECIPES SERVICE
// ============================================================================

export class SupabaseRecipeService {

  async getRecipesByCategory(category: Recipe['recipe_category']): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('recipe_category', category)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as Recipe[]) || []
  }

  async getBeginnerRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_beginner_friendly', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as Recipe[]) || []
  }

  async getFeaturedRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_featured', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as Recipe[]) || []
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_published', true)
      .or(`recipe_name.ilike.%${query}%,recipe_description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as Recipe[]) || []
  }

  async getRecipeBySlug(slug: string): Promise<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(handleSupabaseError(error))
    }

    return data as Recipe
  }

  async createRecipe(recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select()
      .single()

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return data as Recipe
  }
}

// ============================================================================
// VLOGS SERVICE
// ============================================================================

export class SupabaseVlogsService {
  async getVlogsPageContent(): Promise<VlogsPageContent | null> {
    const { data, error } = await supabase
      .from('vlogs_page_content')
      .select('*')
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(handleSupabaseError(error))
    }

    return data as VlogsPageContent
  }

  async getCarouselVideos(carouselId: string): Promise<CarouselVideo[]> {
    const { data, error } = await supabase
      .from('carousel_videos')
      .select('*')
      .eq('carousel_id', carouselId)
      .order('sort_order')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as CarouselVideo[]) || []
  }

  async getPhotoAlbums(): Promise<PhotoAlbum[]> {
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as PhotoAlbum[]) || []
  }

  async getAlbumPhotos(albumId: string): Promise<AlbumPhoto[]> {
    const { data, error } = await supabase
      .from('album_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('sort_order')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as AlbumPhoto[]) || []
  }
}

// ============================================================================
// STOREFRONT SERVICE
// ============================================================================

export class SupabaseStorefrontService {
  async getStorefrontProducts(): Promise<StorefrontProduct[]> {
    const { data, error } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('status', 'published')
      .order('product_title')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    // Transform the data to match expected interface
    const transformedData = data?.map(product => ({
      id: product.id,
      name: product.product_title,
      slug: product.slug || product.product_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: product.product_description || '',
      price: '$0.00', // Not available in actual schema
      image_url: product.product_image_path || '',
      category_id: product.category_name.toLowerCase().replace(/\s+/g, '-'),
      status: product.status,
      is_favorite: product.showInFavorites || false,
      tags: product.tags || [],
      amazon_url: product.amazon_url,
      click_count: product.click_count || 0,
      last_clicked_at: null, // Not available in actual schema
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || []

    return transformedData as StorefrontProduct[]
  }

  async getProductsByCategory(categoryId: string): Promise<StorefrontProduct[]> {
    // Convert category ID back to category name
    const categoryName = categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    const { data, error } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('category_name', categoryName)
      .eq('status', 'published')
      .order('product_title')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    // Transform the data to match expected interface
    const transformedData = data?.map(product => ({
      id: product.id,
      name: product.product_title,
      slug: product.slug || product.product_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: product.product_description || '',
      price: '$0.00', // Not available in actual schema
      image_url: product.product_image_path || '',
      category_id: product.category_name.toLowerCase().replace(/\s+/g, '-'),
      status: product.status,
      is_favorite: product.showInFavorites || false,
      tags: product.tags || [],
      amazon_url: product.amazon_url,
      click_count: product.click_count || 0,
      last_clicked_at: null, // Not available in actual schema
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || []

    return transformedData as StorefrontProduct[]
  }

  async getFavoriteProducts(): Promise<StorefrontProduct[]> {
    const { data, error } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('showInFavorites', true)
      .eq('status', 'published')
      .order('product_title')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    // Transform the data to match expected interface
    const transformedData = data?.map(product => ({
      id: product.id,
      name: product.product_title,
      slug: product.slug || product.product_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: product.product_description || '',
      price: '$0.00', // Not available in actual schema
      image_url: product.product_image_path || '',
      category_id: product.category_name.toLowerCase().replace(/\s+/g, '-'),
      status: product.status,
      is_favorite: product.showInFavorites || false,
      tags: product.tags || [],
      amazon_url: product.amazon_url,
      click_count: product.click_count || 0,
      last_clicked_at: null, // Not available in actual schema
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || []

    return transformedData as StorefrontProduct[]
  }

  async findProductBySlug(slug: string): Promise<StorefrontProduct | null> {
    const { data, error } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(handleSupabaseError(error))
    }

    return data as StorefrontProduct
  }

  async getCategories(): Promise<StorefrontCategory[]> {
    const { data, error } = await supabase
      .from('storefront_categories')
      .select('*')
      .order('created_at')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    // Transform the data to match expected interface
    const transformedData = data?.map(cat => ({
      id: cat.category_name.toLowerCase().replace(/\s+/g, '-'), // Convert to slug format
      name: cat.category_name,
      description: cat.category_description || '',
      image_url: cat.category_image_path || '',
      sort_order: 0, // Not available in actual schema
      created_at: cat.created_at,
      updated_at: cat.updated_at
    })) || []

    return transformedData as StorefrontCategory[]
  }

  async trackProductClick(productId: string): Promise<StorefrontProduct> {
    // Get current product
    const { data: product, error: getError } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (getError) {
      throw new Error(handleSupabaseError(getError))
    }

    // Update click count
    const { data: updatedProduct, error: updateError } = await supabase
      .from('storefront_products')
      .update({
        click_count: (product.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      throw new Error(handleSupabaseError(updateError))
    }

    return updatedProduct as StorefrontProduct
  }

  async seedData() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Seeding only allowed in development');
      return;
    }

    try {
      // Seed categories using actual schema
      const { error: catError } = await supabase
        .from('storefront_categories')
        .upsert([
          {
            category_name: 'Food',
            category_description: 'Nourishing staples for your kitchen',
            category_image_path: '/tiles/foodTile.jpg',
            is_featured: false
          },
          {
            category_name: 'Healing',
            category_description: 'Mindful tools and natural remedies',
            category_image_path: '/tiles/healingTile.jpg',
            is_featured: false
          },
          {
            category_name: 'Home',
            category_description: 'Items to create a mindful space',
            category_image_path: '/tiles/homeTile.jpg',
            is_featured: false
          },
          {
            category_name: 'Personal Care',
            category_description: 'Daily essentials for skin and body',
            category_image_path: '/tiles/personalTile.jpg',
            is_featured: false
          }
        ], { onConflict: 'category_name' });

      if (catError) throw catError;

      // Seed products using actual schema
      const { error: prodError } = await supabase
        .from('storefront_products')
        .upsert([
          {
            category_name: 'Food',
            product_title: 'Sample Food Product',
            product_description: 'A sample food product for development',
            product_image_path: '/tiles/foodTile.jpg',
            amazon_url: 'https://amazon.com/sample-food',
            status: 'published',
            showInFavorites: true,
            tags: ['sample', 'development'],
            slug: 'sample-food-product'
          },
          {
            category_name: 'Healing',
            product_title: 'Sample Healing Product',
            product_description: 'A sample healing product for development',
            product_image_path: '/tiles/healingTile.jpg',
            amazon_url: 'https://amazon.com/sample-healing',
            status: 'published',
            showInFavorites: true,
            tags: ['sample', 'development'],
            slug: 'sample-healing-product'
          },
          {
            category_name: 'Home',
            product_title: 'Sample Home Product',
            product_description: 'A sample home product for development',
            product_image_path: '/tiles/homeTile.jpg',
            amazon_url: 'https://amazon.com/sample-home',
            status: 'published',
            showInFavorites: false,
            tags: ['sample', 'development'],
            slug: 'sample-home-product'
          }
        ]);

      if (prodError) throw prodError;

      console.log('Successfully seeded storefront data');
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
}

// ============================================================================
// HEALING SERVICE
// ============================================================================

export class SupabaseHealingService {
  async getHealingPageContent(): Promise<HealingPageContent | null> {
    const { data, error } = await supabase
      .from('healing_page_content')
      .select('*')
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(handleSupabaseError(error))
    }

    return data as HealingPageContent
  }

  async getHealingProducts(): Promise<HealingProduct[]> {
    const { data, error } = await supabase
      .from('healing_products')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (error) {
      throw new Error(handleSupabaseError(error))
    }

    return (data as HealingProduct[]) || []
  }
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export class SupabaseApiHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return { data, message }
  }

  static error(error: string): ApiResponse<never> {
    return { error }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================