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

  getAllRecipes(): Recipe[] {
    const savedRecipes = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    return savedRecipes ? JSON.parse(savedRecipes) : [];
  }

  getLegacyRecipes(): LegacyRecipe[] {
    return this.getAllRecipes().map(recipe => ({
      title: recipe.title,
      slug: recipe.slug,
      images: recipe.images,
      category: recipe.category,
      label: recipe.folder,
    }));
  }

  getBeginnerRecipes(): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.isBeginner);
  }

  getRecipeOfWeek(): Recipe | null {
    return this.getAllRecipes().find(recipe => recipe.isRecipeOfWeek) || null;
  }

  getRecipesByFolder(folder: string): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.folder === folder);
  }

  addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const recipes = this.getAllRecipes();
    recipes.push(newRecipe);
    this.saveRecipes(recipes);
    return newRecipe;
  }

  updateRecipe(id: string, updates: Partial<Recipe>): Recipe | null {
    const recipes = this.getAllRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index === -1) return null;
    const updated: Recipe = { ...recipes[index], ...updates, updatedAt: new Date() };
    recipes[index] = updated;
    this.saveRecipes(recipes);
    return updated;
  }

  deleteRecipe(id: string): boolean {
    const recipes = this.getAllRecipes();
    const filtered = recipes.filter(recipe => recipe.id !== id);
    if (filtered.length === recipes.length) return false;
    this.saveRecipes(filtered);
    return true;
  }

  searchRecipes(query: string, folder?: string): Recipe[] {
    const recipes = folder ? this.getRecipesByFolder(folder) : this.getAllRecipes();
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

  exportRecipes(): string { return JSON.stringify(this.getAllRecipes(), null, 2); }
  importRecipes(jsonData: string): void { const parsed = JSON.parse(jsonData); this.saveRecipes(parsed); }
  clearAllRecipes(): void { if (typeof localStorage !== 'undefined') localStorage.removeItem(this.STORAGE_KEY); }

  getRecipeStats(): { total: number; byFolder: Record<string, number>; beginners: number; recipeOfWeek: number; } {
    const recipes = this.getAllRecipes();
    const byFolder: Record<string, number> = {};
    recipes.forEach(r => { byFolder[r.folder] = (byFolder[r.folder] || 0) + 1; });
    return { total: recipes.length, byFolder, beginners: recipes.filter(r => r.isBeginner).length, recipeOfWeek: recipes.filter(r => r.isRecipeOfWeek).length };
  }
}

export const recipeService = new RecipeService();
export default recipeService;

