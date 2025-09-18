import type { Database } from '@/types/supabase.generated'

type RecipeRow = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
type PageContentRow = Database['public']['Tables']['recipes_page_content']['Row']
type PageContentInsert = Database['public']['Tables']['recipes_page_content']['Insert']
type PageContentUpdate = Database['public']['Tables']['recipes_page_content']['Update']
// Recipe hero video logic has been moved to lib/services/recipeHeroService.ts

export type RecipeStatus = Database['public']['Enums']['recipe_status']

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
      const response = await fetch('/api/recipes');
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();

      // Map database fields to service interface
      return (data.recipes as RecipeRow[] || []).map((r: RecipeRow) => ({
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
        images: r.images || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || [],
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch recipe');
      }
      const data = await response.json();
      const r = data.recipe as RecipeRow;

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
        images: r.images || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
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
        hero_image_path: recipe.hero_image_path,
        images: recipe.images
      };

      const response = await fetch('/api/recipes', {
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
        images: r.images || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
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
      if (updates.images !== undefined) updateData.images = updates.images;

      const response = await fetch(`/api/recipes/${id}`, {
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
        images: r.images || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
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
      const response = await fetch('/api/recipes/page-content');
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

      const response = await fetch('/api/recipes/page-content', {
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
}

export const recipeService = new RecipeService();
export default recipeService;