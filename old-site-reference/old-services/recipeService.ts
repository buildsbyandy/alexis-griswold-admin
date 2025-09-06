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

// Legacy recipe interface for existing data
export interface LegacyRecipe {
  title: string;
  slug: string;
  images: string[];
  category: string;
  label: string;
}

class RecipeService {
  private readonly STORAGE_KEY = 'adminRecipes';

  // Get all recipes (admin format)
  getAllRecipes(): Recipe[] {
    const savedRecipes = localStorage.getItem(this.STORAGE_KEY);
    if (savedRecipes) {
      return JSON.parse(savedRecipes);
    }
    return [];
  }

  // Get recipes for the main recipes page (legacy format for compatibility)
  getLegacyRecipes(): LegacyRecipe[] {
    const adminRecipes = this.getAllRecipes();
    
    // Convert admin recipes to legacy format
    return adminRecipes.map(recipe => ({
      title: recipe.title,
      slug: recipe.slug,
      images: recipe.images,
      category: recipe.category,
      label: recipe.folder, // Use folder as label for categorization
    }));
  }

  // Get beginner recipes
  getBeginnerRecipes(): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.isBeginner);
  }

  // Get recipe of the week
  getRecipeOfWeek(): Recipe | null {
    const recipeOfWeek = this.getAllRecipes().find(recipe => recipe.isRecipeOfWeek);
    return recipeOfWeek || null;
  }

  // Get recipes by folder
  getRecipesByFolder(folder: string): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.folder === folder);
  }

  // Add new recipe
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

  // Update recipe
  updateRecipe(id: string, updates: Partial<Recipe>): Recipe | null {
    const recipes = this.getAllRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id);
    
    if (index === -1) return null;

    const updatedRecipe: Recipe = {
      ...recipes[index],
      ...updates,
      updatedAt: new Date(),
    };

    recipes[index] = updatedRecipe;
    this.saveRecipes(recipes);

    return updatedRecipe;
  }

  // Delete recipe
  deleteRecipe(id: string): boolean {
    const recipes = this.getAllRecipes();
    const filteredRecipes = recipes.filter(recipe => recipe.id !== id);
    
    if (filteredRecipes.length === recipes.length) {
      return false; // Recipe not found
    }

    this.saveRecipes(filteredRecipes);
    return true;
  }

  // Search recipes
  searchRecipes(query: string, folder?: string): Recipe[] {
    const recipes = folder 
      ? this.getRecipesByFolder(folder)
      : this.getAllRecipes();

    const lowerQuery = query.toLowerCase();
    
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(lowerQuery))
    );
  }

  // Import legacy recipes (for migration)
  importLegacyRecipes(legacyRecipes: LegacyRecipe[]): void {
    const adminRecipes: Recipe[] = legacyRecipes.map(legacy => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      difficulty: 'Easy' as const,
      tags: [legacy.label],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    this.saveRecipes(adminRecipes);
  }

  // Helper method to map legacy categories to new folders
  private mapCategoryToFolder(category: string, label: string): string {
    if (category === 'Shakes') {
      return label.toLowerCase().includes('juice') ? 'juices' : 'smoothies';
    }
    if (category === 'Breakfast' || category === 'Lunch' || category === 'Dinner') {
      return 'meals';
    }
    if (label === 'Raw') {
      return 'raw';
    }
    if (label.toLowerCase().includes('dressing') || label.toLowerCase().includes('sauce') || label.toLowerCase().includes('mustard')) {
      return 'sauces';
    }
    if (label.toLowerCase().includes('brownie') || label.toLowerCase().includes('pudding') || label.toLowerCase().includes('cup') || label.toLowerCase().includes('bar')) {
      return 'desserts';
    }
    return 'meals'; // Default
  }

  // Helper method to identify beginner recipes
  private isBeginnerRecipe(title: string): boolean {
    const beginnerKeywords = [
      'garden salad',
      'simple tahini dressing',
      'fiber fruit bowl',
      'mango chia pudding',
      'maple trail mix',
      'quinoa porridge'
    ];
    
    return beginnerKeywords.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
  }

  // Save recipes to localStorage
  private saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
  }

  // Export recipes (for backup)
  exportRecipes(): string {
    return JSON.stringify(this.getAllRecipes(), null, 2);
  }

  // Import recipes from JSON
  importRecipes(jsonData: string): void {
    try {
      const recipes = JSON.parse(jsonData);
      this.saveRecipes(recipes);
    } catch (error) {
      console.error('Failed to import recipes:', error);
      throw new Error('Invalid recipe data format');
    }
  }

  // Clear all recipes
  clearAllRecipes(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get recipe statistics
  getRecipeStats(): {
    total: number;
    byFolder: Record<string, number>;
    beginners: number;
    recipeOfWeek: number;
  } {
    const recipes = this.getAllRecipes();
    const byFolder: Record<string, number> = {};
    
    recipes.forEach(recipe => {
      byFolder[recipe.folder] = (byFolder[recipe.folder] || 0) + 1;
    });

    return {
      total: recipes.length,
      byFolder,
      beginners: recipes.filter(r => r.isBeginner).length,
      recipeOfWeek: recipes.filter(r => r.isRecipeOfWeek).length,
    };
  }
}

// Export singleton instance
export const recipeService = new RecipeService();
export default recipeService; 