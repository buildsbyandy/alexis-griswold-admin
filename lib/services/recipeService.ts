export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  folder: string;
  isBeginner: boolean;
  isRecipeOfWeek: boolean;
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
        images: r.images || [],
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        prepTime: r.prepTime || '',
        cookTime: r.cookTime || '',
        servings: r.servings || 1,
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || [],
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
    // For now, use localStorage for adding (API endpoint would need POST implementation)
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Fallback to localStorage for adding recipes
    const savedRecipes = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    const recipes = savedRecipes ? JSON.parse(savedRecipes) : [];
    recipes.push(newRecipe);
    this.saveRecipes(recipes);
    return newRecipe;
  }

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    // Fallback to localStorage for updating recipes
    const savedRecipes = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    const recipes = savedRecipes ? JSON.parse(savedRecipes) : [];
    const index = recipes.findIndex((recipe: Recipe) => recipe.id === id);
    if (index === -1) return null;
    const updated: Recipe = { ...recipes[index], ...updates, updatedAt: new Date() };
    recipes[index] = updated;
    this.saveRecipes(recipes);
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    // Fallback to localStorage for deleting recipes
    const savedRecipes = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    const recipes = savedRecipes ? JSON.parse(savedRecipes) : [];
    const filtered = recipes.filter((recipe: Recipe) => recipe.id !== id);
    if (filtered.length === recipes.length) return false;
    this.saveRecipes(filtered);
    return true;
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

