import type { Database } from '@/types/supabase.generated'
import { getMediaUrl, type ContentStatus } from '@/lib/utils/storageHelpers'
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
  deleteCarouselItem,
} from './carouselService'

/**
 * Gets the appropriate base URL for API calls based on the current environment.
 */
function getApiBaseUrl(): string {
  // Client-side: browser can handle relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: Node.js needs absolute URLs
  return process.env.NODE_ENV === 'production'
    ? 'https://admin.alexisgriswold.com'
    : 'http://localhost:3000';
}

type RecipeRow = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
type PageContentRow = Database['public']['Tables']['recipes_page_content']['Row']
type PageContentInsert = Database['public']['Tables']['recipes_page_content']['Insert']
type PageContentUpdate = Database['public']['Tables']['recipes_page_content']['Update']
type RecipeFolderRow = Database['public']['Tables']['recipe_folders']['Row']
type RecipeFolderInsert = Database['public']['Tables']['recipe_folders']['Insert']
type RecipeFolderUpdate = Database['public']['Tables']['recipe_folders']['Update']
// Recipe hero video logic has been moved to lib/services/recipeHeroService.ts

export type RecipeStatus = Database['public']['Enums']['recipe_status']

export interface RecipeFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_visible: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  folder_slug: string;
  is_beginner: boolean;
  is_recipe_of_week: boolean;
  status: RecipeStatus;
  is_favorite: boolean;
  hero_image_path?: string;
  images: string[];
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface RecipePageContent {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBody: string;
  heroBackgroundImage?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
  beginnerSectionTitle: string;
  beginnerSectionSubtitle: string;
  showBeginnerSection: boolean;
  pageSeoTitle: string;
  pageSeoDescription: string;
  created_at: Date;
  updated_at: Date;
}

// Recipe hero video types have moved to lib/services/recipeHeroService.ts

export interface LegacyRecipe {
  title: string;
  slug: string;
  images: string[];
  category: string;
  label: string;
}

class RecipeService {
  private readonly STORAGE_KEY = 'adminRecipes';

  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();

      // Map database fields to service interface and fetch images from recipe_steps
      const recipes = await Promise.all(
        (data.recipes as RecipeRow[] || []).map(async (r: RecipeRow) => {
          // Fetch recipe steps to get images
          let images: string[] = [];
          try {
            const stepsResponse = await fetch(`${baseUrl}/api/recipes/${r.id}/steps`);
            if (stepsResponse.ok) {
              const stepsData = await stepsResponse.json();
              images = (stepsData.steps || [])
                .filter((step: any) => step.image_path)
                .map((step: any) => step.image_path);
            }
          } catch (error) {
            console.error(`Error fetching steps for recipe ${r.id}:`, error);
          }

          return {
            id: r.id,
            title: r.title,
            slug: r.slug,
            description: r.description || '',
            category: r.category || '',
            folder_slug: r.folder_slug || '',
            is_beginner: r.is_beginner || false,
            is_recipe_of_week: r.is_recipe_of_week || false,
            status: r.status,
            is_favorite: r.is_favorite || false,
            hero_image_path: r.hero_image_path || '',
            images: images,
            ingredients: [],
            instructions: [],
            prepTime: r.prepTime || '',
            cookTime: r.cookTime || '',
            servings: r.servings || 1,
            difficulty: r.difficulty || 'Easy',
            tags: r.tags || [],
            created_at: new Date(r.created_at),
            updated_at: new Date(r.updated_at)
          };
        })
      );

      return recipes;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch recipe');
      }
      const data = await response.json();
      const r = data.recipe as RecipeRow;

      // Fetch recipe steps to get images
      let images: string[] = [];
      try {
        const stepsResponse = await fetch(`${baseUrl}/api/recipes/${r.id}/steps`);
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json();
          images = (stepsData.steps || [])
            .filter((step: any) => step.image_path)
            .map((step: any) => step.image_path);
        }
      } catch (error) {
        console.error(`Error fetching steps for recipe ${r.id}:`, error);
      }

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        category: r.category || '',
        folder_slug: r.folder_slug || '',
        is_beginner: r.is_beginner || false,
        is_recipe_of_week: r.is_recipe_of_week || false,
        status: r.status,
        is_favorite: r.is_favorite || false,
        hero_image_path: r.hero_image_path || '',
        images: images,
        ingredients: [],
        instructions: [],
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || [],
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      };
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }

  async getLegacyRecipes(): Promise<LegacyRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.map(recipe => ({
      title: recipe.title,
      slug: recipe.slug,
      images: recipe.images,
      category: recipe.category,
      label: recipe.folder_slug,
    }));
  }

  async getBeginnerRecipes(): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.is_beginner);
  }

  async getRecipeOfWeek(): Promise<Recipe | null> {
    const recipes = await this.getAllRecipes();
    return recipes.find(recipe => recipe.is_recipe_of_week) || null;
  }

  async getRecipesByFolder(folder: string): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.folder_slug === folder);
  }

  async addRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> {
    try {
      // Map interface to database fields
      const recipeData = {
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        category: recipe.category,
        folder_slug: recipe.folder_slug,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags,
        status: recipe.status,
        is_favorite: recipe.is_favorite,
        is_beginner: recipe.is_beginner,
        is_recipe_of_week: recipe.is_recipe_of_week,
        hero_image_path: recipe.hero_image_path
      };

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const r = data.recipe as RecipeRow;

      // Fetch recipe steps to get images (usually empty for new recipes)
      let images: string[] = [];
      try {
        const stepsResponse = await fetch(`${baseUrl}/api/recipes/${r.id}/steps`);
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json();
          images = (stepsData.steps || [])
            .filter((step: any) => step.image_path)
            .map((step: any) => step.image_path);
        }
      } catch (error) {
        console.error(`Error fetching steps for recipe ${r.id}:`, error);
      }

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        category: r.category || '',
        folder_slug: r.folder_slug || '',
        is_beginner: r.is_beginner || false,
        is_recipe_of_week: r.is_recipe_of_week || false,
        status: r.status,
        is_favorite: r.is_favorite || false,
        hero_image_path: r.hero_image_path || '',
        images: images,
        ingredients: [],
        instructions: [],
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || [],
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      };
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    try {
      // Map interface fields to database fields for the update
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.folder_slug !== undefined) updateData.folder_slug = updates.folder_slug;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.servings !== undefined) updateData.servings = updates.servings;
      if (updates.prepTime !== undefined) updateData.prepTime = updates.prepTime;
      if (updates.cookTime !== undefined) updateData.cookTime = updates.cookTime;
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
      if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.is_favorite !== undefined) updateData.is_favorite = updates.is_favorite;
      if (updates.is_beginner !== undefined) updateData.is_beginner = updates.is_beginner;
      if (updates.is_recipe_of_week !== undefined) updateData.is_recipe_of_week = updates.is_recipe_of_week;
      if (updates.hero_image_path !== undefined) updateData.hero_image_path = updates.hero_image_path;
      // Note: images are now managed through recipe_steps, not directly on recipes table

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const r = data.recipe as RecipeRow;

      // Fetch recipe steps to get images
      let images: string[] = [];
      try {
        const stepsResponse = await fetch(`${baseUrl}/api/recipes/${r.id}/steps`);
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json();
          images = (stepsData.steps || [])
            .filter((step: any) => step.image_path)
            .map((step: any) => step.image_path);
        }
      } catch (error) {
        console.error(`Error fetching steps for recipe ${r.id}:`, error);
      }

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        category: r.category || '',
        folder_slug: r.folder_slug || '',
        is_beginner: r.is_beginner || false,
        is_recipe_of_week: r.is_recipe_of_week || false,
        status: r.status,
        is_favorite: r.is_favorite || false,
        hero_image_path: r.hero_image_path || '',
        images: images,
        ingredients: [],
        instructions: [],
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || [],
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      };
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  async deleteRecipe(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      });

      if (response.status === 404) return false;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  async searchRecipes(query: string, folder?: string): Promise<Recipe[]> {
    const recipes = folder ? await this.getRecipesByFolder(folder) : await this.getAllRecipes();
    const lower = (query || '').toLowerCase();
    return recipes.filter(r =>
      r.title.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.tags.some(t => t.toLowerCase().includes(lower)) ||
      r.ingredients.some(i => i.toLowerCase().includes(lower))
    );
  }

  // Page Content Methods
  async getPageContent(): Promise<RecipePageContent | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/page-content`);
      if (!response.ok) throw new Error('Failed to fetch page content');
      const data = await response.json();
      const content = data.content as PageContentRow;

      if (!content) return null;

      return {
        id: content.id,
        heroTitle: content.hero_title || '',
        heroSubtitle: content.hero_subtitle || '',
        heroBody: content.hero_body_paragraph || '',
        heroBackgroundImage: content.hero_background_image || undefined,
        heroCtaText: content.hero_cta_text || undefined,
        heroCtaUrl: content.hero_cta_url || undefined,
        beginnerSectionTitle: content.beginner_section_title || '',
        beginnerSectionSubtitle: content.beginner_section_subtitle || '',
        showBeginnerSection: content.show_beginner_section || false,
        pageSeoTitle: content.page_seo_title || '',
        pageSeoDescription: content.page_seo_description || '',
        created_at: new Date(content.created_at),
        updated_at: new Date(content.updated_at)
      };
    } catch (error) {
      console.error('Error fetching page content:', error);
      return null;
    }
  }

  async updatePageContent(content: Partial<RecipePageContent>): Promise<RecipePageContent | null> {
    try {
      // Map interface to database fields
      const updateData: any = {};
      if (content.heroTitle !== undefined) updateData.hero_title = content.heroTitle;
      if (content.heroSubtitle !== undefined) updateData.hero_subtitle = content.heroSubtitle;
      if (content.heroBody !== undefined) updateData.hero_body_paragraph = content.heroBody;
      if (content.heroBackgroundImage !== undefined) updateData.hero_background_image = content.heroBackgroundImage;
      if (content.heroCtaText !== undefined) updateData.hero_cta_text = content.heroCtaText;
      if (content.heroCtaUrl !== undefined) updateData.hero_cta_url = content.heroCtaUrl;
      if (content.beginnerSectionTitle !== undefined) updateData.beginner_section_title = content.beginnerSectionTitle;
      if (content.beginnerSectionSubtitle !== undefined) updateData.beginner_section_subtitle = content.beginnerSectionSubtitle;
      if (content.showBeginnerSection !== undefined) updateData.show_beginner_section = content.showBeginnerSection;
      if (content.pageSeoTitle !== undefined) updateData.page_seo_title = content.pageSeoTitle;
      if (content.pageSeoDescription !== undefined) updateData.page_seo_description = content.pageSeoDescription;

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/page-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const pageContent = data.content as PageContentRow;

      return {
        id: pageContent.id,
        heroTitle: pageContent.hero_title || '',
        heroSubtitle: pageContent.hero_subtitle || '',
        heroBody: pageContent.hero_body_paragraph || '',
        heroBackgroundImage: pageContent.hero_background_image || undefined,
        heroCtaText: pageContent.hero_cta_text || undefined,
        heroCtaUrl: pageContent.hero_cta_url || undefined,
        beginnerSectionTitle: pageContent.beginner_section_title || '',
        beginnerSectionSubtitle: pageContent.beginner_section_subtitle || '',
        showBeginnerSection: pageContent.show_beginner_section || false,
        pageSeoTitle: pageContent.page_seo_title || '',
        pageSeoDescription: pageContent.page_seo_description || '',
        created_at: new Date(pageContent.created_at),
        updated_at: new Date(pageContent.updated_at)
      };
    } catch (error) {
      console.error('Error updating page content:', error);
      throw error;
    }
  }

  // Hero Video methods have been removed. Use recipeHeroService instead.

  // Legacy and utility methods
  importLegacyRecipes(legacyRecipes: LegacyRecipe[]): void {
    const mapped: Recipe[] = legacyRecipes.map(legacy => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title: legacy.title,
      slug: legacy.slug,
      description: `Recipe for ${legacy.title}`,
      category: legacy.category,
      folder_slug: this.mapCategoryToFolder(legacy.category, legacy.label),
      is_beginner: this.isBeginnerRecipe(legacy.title),
      is_recipe_of_week: false,
      status: 'published' as RecipeStatus,
      is_favorite: false,
      hero_image_path: legacy.images[0] || undefined,
      images: legacy.images,
      ingredients: [''],
      instructions: [''],
      prepTime: '',
      cookTime: '',
      servings: 1,
      difficulty: 'Easy',
      tags: [legacy.label],
      created_at: new Date(),
      updated_at: new Date(),
    }));
    this.saveRecipes(mapped);
  }

  private mapCategoryToFolder(category: string, label: string): string {
    if (category === 'Shakes') return label.toLowerCase().includes('juice') ? 'juices' : 'smoothies';
    if (['Breakfast', 'Lunch', 'Dinner'].includes(category)) return 'meals';
    if (label === 'Raw') return 'raw';
    if (/dressing|sauce|mustard/i.test(label)) return 'sauces';
    if (/brownie|pudding|cup|bar/i.test(label)) return 'desserts';
    return 'meals';
  }

  private isBeginnerRecipe(title: string): boolean {
    const beginner = ['garden salad', 'simple tahini dressing', 'fiber fruit bowl', 'mango chia pudding', 'maple trail mix', 'quinoa porridge'];
    return beginner.some(k => title.toLowerCase().includes(k));
  }

  private saveRecipes(recipes: Recipe[]): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
  }

  async exportRecipes(): Promise<string> {
    const recipes = await this.getAllRecipes();
    return JSON.stringify(recipes, null, 2);
  }

  importRecipes(jsonData: string): void {
    const parsed = JSON.parse(jsonData);
    this.saveRecipes(parsed);
  }

  clearAllRecipes(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(this.STORAGE_KEY);
  }

  async getRecipeStats(): Promise<{ total: number; byFolder: Record<string, number>; beginners: number; recipeOfWeek: number; }> {
    const recipes = await this.getAllRecipes();
    const byFolder: Record<string, number> = {};
    recipes.forEach(r => { byFolder[r.folder_slug] = (byFolder[r.folder_slug] || 0) + 1; });
    return {
      total: recipes.length,
      byFolder,
      beginners: recipes.filter(r => r.is_beginner).length,
      recipeOfWeek: recipes.filter(r => r.is_recipe_of_week).length
    };
  }

  /**
   * Maps recipe status to content status for bucket selection
   */
  getRecipeContentStatus(recipe: Recipe): ContentStatus {
    return recipe.status as ContentStatus;
  }

  /**
   * Gets the appropriate media URL for recipe images
   */
  async getRecipeImageUrl(imageUrl: string, recipe?: Recipe): Promise<string | null> {
    if (!imageUrl) return null;

    // For existing recipes, determine if we should use signed URLs based on status
    const forceSignedUrl = recipe ? recipe.status !== 'published' : false;
    return await getMediaUrl(imageUrl, forceSignedUrl);
  }

  /**
   * Gets all image URLs for a recipe with proper bucket handling
   */
  async getRecipeImages(recipe: Recipe): Promise<string[]> {
    const imageUrls: string[] = [];

    // Add hero image
    if (recipe.hero_image_path) {
      const heroUrl = await this.getRecipeImageUrl(recipe.hero_image_path, recipe);
      if (heroUrl) imageUrls.push(heroUrl);
    }

    // Add additional images
    for (const imagePath of recipe.images) {
      const imageUrl = await this.getRecipeImageUrl(imagePath, recipe);
      if (imageUrl) imageUrls.push(imageUrl);
    }

    return imageUrls;
  }

  // Featured recipe methods using carousel system
  async getFeaturedRecipe(): Promise<Recipe | null> {
    try {
      // Use carousel system to get the featured recipe
      const carousel = await findCarouselByPageSlug('recipes', 'recipes-weekly-pick');
      if (carousel.error || !carousel.data) {
        return null;
      }

      const items = await getCarouselItems(carousel.data.id);
      if (items.error || !items.data || items.data.length === 0) {
        return null;
      }

      // Get the first (and should be only) item from the featured carousel
      const featuredItem = items.data[0];
      if (!featuredItem.ref_id) {
        return null;
      }

      // Fetch the actual recipe data
      const featuredRecipe = await this.getRecipe(featuredItem.ref_id);
      return featuredRecipe;
    } catch (error) {
      console.error('Error fetching featured recipe from carousel:', error);
      return null;
    }
  }

  async setFeaturedRecipe(recipeId: string): Promise<boolean> {
    try {
      // 1. Find or create the 'recipes-weekly-pick' carousel
      let carousel = await findCarouselByPageSlug('recipes', 'recipes-weekly-pick');
      if (carousel.error || !carousel.data) {
        // Create the carousel if it doesn't exist
        const created = await createCarousel({
          page: 'recipes',
          slug: 'recipes-weekly-pick',
          title: 'Weekly Pick',
          is_active: true
        });
        if (created.error) {
          return false;
        }
        carousel = { data: created.data };
      }

      // 2. Delete all existing items from the featured carousel to enforce "only one" rule
      const currentItems = await getCarouselItems(carousel.data!.id);
      if (currentItems.data && currentItems.data.length > 0) {
        for (const item of currentItems.data) {
          await deleteCarouselItem(item.id);
        }
      }

      // 3. Get the recipe data to create a proper carousel item
      const recipe = await this.getRecipe(recipeId);
      if (!recipe) {
        return false;
      }

      // 4. Create one new carousel_item that links the recipeId to the featured carousel
      const result = await createCarouselItem({
        carousel_id: carousel.data!.id,
        kind: 'recipe',
        ref_id: recipeId,
        caption: recipe.title,
        order_index: 0,
        is_active: true,
        album_id: null,
        youtube_id: null,
        link_url: null,
        image_path: recipe.hero_image_path || null,
        badge: null,
      });

      return !result.error;
    } catch (error) {
      console.error('Error setting featured recipe:', error);
      return false;
    }
  }

  async removeFeaturedRecipe(): Promise<boolean> {
    try {
      // Find the 'recipes-weekly-pick' carousel
      const carousel = await findCarouselByPageSlug('recipes', 'recipes-weekly-pick');
      if (carousel.error || !carousel.data) {
        return true; // Already no featured recipe
      }

      // Delete all items from the featured carousel
      const currentItems = await getCarouselItems(carousel.data.id);
      if (currentItems.data && currentItems.data.length > 0) {
        for (const item of currentItems.data) {
          await deleteCarouselItem(item.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error removing featured recipe:', error);
      return false;
    }
  }

  // Favorite recipe methods using carousel system
  async set_favorite(recipeId: string, on: boolean): Promise<boolean> {
    try {
      // 1. Ensure favorites carousel exists
      let carousel = await findCarouselByPageSlug('recipes', 'recipes-favorites');
      if (carousel.error || !carousel.data) {
        // Create the carousel if it doesn't exist
        const created = await createCarousel({
          page: 'recipes',
          slug: 'recipes-favorites',
          title: 'Favorite Recipes',
          is_active: true
        });
        if (created.error) {
          return false;
        }
        carousel = { data: created.data };
      }

      // 2. Get current items to check if recipe is already in favorites
      const currentItems = await getCarouselItems(carousel.data!.id);
      if (currentItems.error) {
        return false;
      }

      const existingItem = currentItems.data?.find(item => item.ref_id === recipeId);

      if (on) {
        // Add to favorites - only if not already there
        if (existingItem) {
          return true; // Already in favorites
        }

        const recipe = await this.getRecipe(recipeId);
        if (!recipe) {
          return false;
        }

        const result = await createCarouselItem({
          carousel_id: carousel.data!.id,
          kind: 'recipe',
          ref_id: recipeId,
          caption: recipe.title,
          order_index: 0,
          is_active: true,
          album_id: null,
          youtube_id: null,
          link_url: null,
          image_path: recipe.hero_image_path || null,
          badge: null,
        });

        return !result.error;
      } else {
        // Remove from favorites - only if it exists
        if (!existingItem) {
          return true; // Already not in favorites
        }

        const result = await deleteCarouselItem(existingItem.id);
        return !result.error;
      }
    } catch (error) {
      console.error('Error setting favorite recipe:', error);
      return false;
    }
  }

  // Recipe Folders CRUD
  async getAllFolders(): Promise<RecipeFolder[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/folders`);
      if (!response.ok) throw new Error('Failed to fetch recipe folders');
      const data = await response.json();

      return (data.folders as RecipeFolderRow[] || []).map((f: RecipeFolderRow) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
        is_visible: f.is_visible ?? true,
        sort_order: f.sort_order,
        created_at: f.created_at,
        updated_at: f.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching recipe folders:', error);
      return [];
    }
  }

  async createFolder(folderData: Omit<RecipeFolder, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/recipes/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating recipe folder:', error);
      return false;
    }
  }

  async updateFolder(id: string, folderData: Partial<RecipeFolder>): Promise<boolean> {
    try {
      const response = await fetch(`/api/recipes/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating recipe folder:', error);
      return false;
    }
  }

  async deleteFolder(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/recipes/folders/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting recipe folder:', error);
      return false;
    }
  }
}

export const recipeService = new RecipeService();
export default recipeService;