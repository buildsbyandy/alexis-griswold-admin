export type RecipeStatus = 'draft' | 'published' | 'archived';

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  folder: string;
  isBeginner: boolean;
  isRecipeOfWeek: boolean;
  status: RecipeStatus;
  isFavorite: boolean;
  imageUrl?: string;
  images: string[];
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
      return (data.recipes || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        category: r.category || '',
        folder: r.folder || '',
        isBeginner: r.isBeginner || false,
        isRecipeOfWeek: r.isRecipeOfWeek || false,
        status: (r.status as RecipeStatus) || 'draft',
        isFavorite: r.is_favorite || false,
        imageUrl: r.hero_image_path || '',
        images: Array.isArray(r.images) ? r.images : (r.images ? JSON.parse(r.images) : []),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : (r.ingredients ? JSON.parse(r.ingredients) : []),
        instructions: Array.isArray(r.instructions) ? r.instructions : (r.instructions ? JSON.parse(r.instructions) : []),
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: Array.isArray(r.tags) ? r.tags : (r.tags ? JSON.parse(r.tags) : []),
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      // Fallback to localStorage for development
      const savedRecipes = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
      return savedRecipes ? JSON.parse(savedRecipes) : [];
    }
  }

  async getLegacyRecipes(): Promise<LegacyRecipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.map(recipe => ({
      title: recipe.title,
      slug: recipe.slug,
      images: recipe.images,
      category: recipe.category,
      label: recipe.folder,
    }));
  }

  async getBeginnerRecipes(): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.isBeginner);
  }

  async getRecipeOfWeek(): Promise<Recipe | null> {
    const recipes = await this.getAllRecipes();
    return recipes.find(recipe => recipe.isRecipeOfWeek) || null;
  }

  async getRecipesByFolder(folder: string): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes();
    return recipes.filter(recipe => recipe.folder === folder);
  }

  async addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Map frontend fields to database fields
          title: recipe.title,
          slug: recipe.slug,
          description: recipe.description,
          hero_image_path: recipe.imageUrl,
          category: recipe.category,
          folder: recipe.folder,
          isBeginner: recipe.isBeginner,
          isRecipeOfWeek: recipe.isRecipeOfWeek,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          images: recipe.images,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          tags: recipe.tags,
          status: recipe.status,
          is_favorite: recipe.isFavorite
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      // Map database fields back to service interface
      return {
        id: data.recipe.id,
        title: data.recipe.title,
        slug: data.recipe.slug,
        description: data.recipe.description || '',
        category: data.recipe.category || '',
        folder: data.recipe.folder || '',
        isBeginner: data.recipe.isBeginner || false,
        isRecipeOfWeek: data.recipe.isRecipeOfWeek || false,
        status: (data.recipe.status as RecipeStatus) || 'draft',
        isFavorite: data.recipe.is_favorite || false,
        imageUrl: data.recipe.hero_image_path || '',
        images: Array.isArray(data.recipe.images) ? data.recipe.images : [],
        ingredients: Array.isArray(data.recipe.ingredients) ? data.recipe.ingredients : [],
        instructions: Array.isArray(data.recipe.instructions) ? data.recipe.instructions : [],
        prepTime: data.recipe.prepTime || '',
        cookTime: data.recipe.cookTime || '',
        servings: data.recipe.servings || 1,
        difficulty: data.recipe.difficulty || 'Easy',
        tags: Array.isArray(data.recipe.tags) ? data.recipe.tags : [],
        createdAt: new Date(data.recipe.created_at),
        updatedAt: new Date(data.recipe.updated_at)
      };
    } catch (error) {
      console.error('Error adding recipe:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    try {
      // Map frontend fields to database fields for the update
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.hero_image_path = updates.imageUrl;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.folder !== undefined) updateData.folder = updates.folder;
      if (updates.isBeginner !== undefined) updateData.isBeginner = updates.isBeginner;
      if (updates.isRecipeOfWeek !== undefined) updateData.isRecipeOfWeek = updates.isRecipeOfWeek;
      if (updates.prepTime !== undefined) updateData.prepTime = updates.prepTime;
      if (updates.cookTime !== undefined) updateData.cookTime = updates.cookTime;
      if (updates.servings !== undefined) updateData.servings = updates.servings;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
      if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;

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
      // Map database fields back to service interface
      return {
        id: data.recipe.id,
        title: data.recipe.title,
        slug: data.recipe.slug,
        description: data.recipe.description || '',
        category: data.recipe.category || '',
        folder: data.recipe.folder || '',
        isBeginner: data.recipe.isBeginner || false,
        isRecipeOfWeek: data.recipe.isRecipeOfWeek || false,
        status: (data.recipe.status as RecipeStatus) || 'draft',
        isFavorite: data.recipe.is_favorite || false,
        imageUrl: data.recipe.hero_image_path || '',
        images: Array.isArray(data.recipe.images) ? data.recipe.images : [],
        ingredients: Array.isArray(data.recipe.ingredients) ? data.recipe.ingredients : [],
        instructions: Array.isArray(data.recipe.instructions) ? data.recipe.instructions : [],
        prepTime: data.recipe.prepTime || '',
        cookTime: data.recipe.cookTime || '',
        servings: data.recipe.servings || 1,
        difficulty: data.recipe.difficulty || 'Easy',
        tags: Array.isArray(data.recipe.tags) ? data.recipe.tags : [],
        createdAt: new Date(data.recipe.created_at),
        updatedAt: new Date(data.recipe.updated_at)
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

  importLegacyRecipes(legacyRecipes: LegacyRecipe[]): void {
    const mapped: Recipe[] = legacyRecipes.map(legacy => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title: legacy.title,
      slug: legacy.slug,
      description: `Recipe for ${legacy.title}`,
      category: legacy.category,
      folder: this.mapCategoryToFolder(legacy.category, legacy.label),
      isBeginner: this.isBeginnerRecipe(legacy.title),
      isRecipeOfWeek: false,
      status: 'published' as RecipeStatus,
      isFavorite: false,
      imageUrl: legacy.images[0] || undefined,
      images: legacy.images,
      ingredients: [''],
      instructions: [''],
      prepTime: '',
      cookTime: '',
      servings: 1,
      difficulty: 'Easy',
      tags: [legacy.label],
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const beginner = ['garden salad','simple tahini dressing','fiber fruit bowl','mango chia pudding','maple trail mix','quinoa porridge'];
    return beginner.some(k => title.toLowerCase().includes(k));
  }

  private saveRecipes(recipes: Recipe[]): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
  }

  async exportRecipes(): Promise<string> { const recipes = await this.getAllRecipes(); return JSON.stringify(recipes, null, 2); }
  importRecipes(jsonData: string): void { const parsed = JSON.parse(jsonData); this.saveRecipes(parsed); }
  clearAllRecipes(): void { if (typeof localStorage !== 'undefined') localStorage.removeItem(this.STORAGE_KEY); }

  async getRecipeStats(): Promise<{ total: number; byFolder: Record<string, number>; beginners: number; recipeOfWeek: number; }> {
    const recipes = await this.getAllRecipes();
    const byFolder: Record<string, number> = {};
    recipes.forEach(r => { byFolder[r.folder] = (byFolder[r.folder] || 0) + 1; });
    return { total: recipes.length, byFolder, beginners: recipes.filter(r => r.isBeginner).length, recipeOfWeek: recipes.filter(r => r.isRecipeOfWeek).length };
  }
}

export const recipeService = new RecipeService();
export default recipeService;

