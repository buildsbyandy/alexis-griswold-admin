/**
 * Relationship Manager
 * 
 * Handles complex relationships between database entities.
 * Manages cascading operations, data integrity, and relational queries.
 */

import type {
  BaseRecord,
  HomeContent,
  NavigationButton,
  VlogsPageContent,
  VideoCarousel,
  CarouselVideo,
  PhotoAlbum,
  AlbumPhoto,
  SpotifySection,
  SpotifyPlaylist,
  RecipesPageContent,
  RecipeHeroCarousel,
  Recipe,
  HealingPageContent,
  HealingCarousel,
  HealingVideo,
  HealingProduct,
  StorefrontPageContent,
  ProductCategory,
  StorefrontProduct,
  FavoritesCarousel,
  FavoriteProduct,
} from '../../types/database';

import {
  MockDatabaseOperations,
  MockDataStore,
} from './mockDatabase';

// ============================================================================
// RELATIONSHIP DEFINITIONS
// ============================================================================

export interface RelationshipConfig {
  parentTable: string;
  childTable: string;
  foreignKey: string;
  onDelete: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
}

export const RELATIONSHIPS: RelationshipConfig[] = [
  // Home page relationships
  {
    parentTable: 'home_content',
    childTable: 'navigation_buttons',
    foreignKey: 'home_content_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // Vlogs page relationships
  {
    parentTable: 'vlogs_page_content',
    childTable: 'video_carousels',
    foreignKey: 'vlogs_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'video_carousels',
    childTable: 'carousel_videos',
    foreignKey: 'carousel_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'vlogs_page_content',
    childTable: 'photo_albums',
    foreignKey: 'vlogs_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'photo_albums',
    childTable: 'album_photos',
    foreignKey: 'album_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'vlogs_page_content',
    childTable: 'spotify_sections',
    foreignKey: 'vlogs_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'spotify_sections',
    childTable: 'spotify_playlists',
    foreignKey: 'spotify_section_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // Recipes page relationships
  {
    parentTable: 'recipes_page_content',
    childTable: 'recipe_hero_carousel',
    foreignKey: 'recipes_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // Healing page relationships
  {
    parentTable: 'healing_page_content',
    childTable: 'healing_carousels',
    foreignKey: 'healing_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'healing_carousels',
    childTable: 'healing_videos',
    foreignKey: 'carousel_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'healing_page_content',
    childTable: 'healing_products',
    foreignKey: 'healing_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  // Storefront relationships
  {
    parentTable: 'product_categories',
    childTable: 'storefront_products',
    foreignKey: 'category_id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'storefront_page_content',
    childTable: 'favorites_carousel',
    foreignKey: 'storefront_page_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'favorites_carousel',
    childTable: 'favorite_products',
    foreignKey: 'carousel_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  {
    parentTable: 'storefront_products',
    childTable: 'favorite_products',
    foreignKey: 'product_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
];

// ============================================================================
// RELATIONSHIP MANAGER CLASS
// ============================================================================

export class RelationshipManager {
  private dataStore: MockDataStore;

  constructor() {
    this.dataStore = MockDataStore.getInstance();
  }

  /**
   * Get all child records for a parent record
   */
  async getChildren<T extends BaseRecord>(
    parentTable: string,
    parentId: string,
    childTable: string,
    foreignKey: string
  ): Promise<T[]> {
    const filter = { [foreignKey]: parentId } as Partial<T>;
    return this.dataStore.findMany<T>(childTable, filter);
  }

  /**
   * Get parent record for a child record
   */
  async getParent<T extends BaseRecord>(
    childTable: string,
    childId: string,
    parentTable: string,
    foreignKey: string
  ): Promise<T | null> {
    const child = this.dataStore.findById(childTable, childId);
    if (!child || !(foreignKey in child)) {
      return null;
    }

    const parentId = (child as any)[foreignKey];
    return this.dataStore.findById<T>(parentTable, parentId);
  }

  /**
   * Delete record with cascade handling
   */
  async deleteWithCascade(table: string, id: string): Promise<boolean> {
    // Find all relationships where this table is the parent
    const cascadeRelationships = RELATIONSHIPS.filter(
      rel => rel.parentTable === table && rel.onDelete === 'CASCADE'
    );

    // Delete child records first
    for (const relationship of cascadeRelationships) {
      const children = await this.getChildren(
        relationship.parentTable,
        id,
        relationship.childTable,
        relationship.foreignKey
      );

      for (const child of children) {
        await this.deleteWithCascade(relationship.childTable, child.id);
      }
    }

    // Delete the parent record
    return this.dataStore.delete(table, id);
  }

  /**
   * Update record with cascade handling
   */
  async updateWithCascade<T extends BaseRecord>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    // Update the main record
    const updated = this.dataStore.update<T>(table, id, data);
    if (!updated) return null;

    // Find all relationships where this table is the parent
    const cascadeRelationships = RELATIONSHIPS.filter(
      rel => rel.parentTable === table && rel.onUpdate === 'CASCADE'
    );

    // Handle cascade updates if the ID changed (rare but possible)
    if ('id' in data && data.id !== id) {
      for (const relationship of cascadeRelationships) {
        const children = await this.getChildren(
          relationship.parentTable,
          id,
          relationship.childTable,
          relationship.foreignKey
        );

        for (const child of children) {
          const updateData = { [relationship.foreignKey]: data.id } as Partial<typeof child>;
          this.dataStore.update(relationship.childTable, child.id, updateData);
        }
      }
    }

    return updated;
  }

  /**
   * Validate referential integrity before operations
   */
  async validateReferences(table: string, data: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Find all relationships where this table is the child
    const parentRelationships = RELATIONSHIPS.filter(rel => rel.childTable === table);

    for (const relationship of parentRelationships) {
      const foreignKeyValue = data[relationship.foreignKey];
      
      if (foreignKeyValue) {
        const parent = this.dataStore.findById(relationship.parentTable, foreignKeyValue);
        if (!parent) {
          errors.push(`Referenced ${relationship.parentTable} with id ${foreignKeyValue} does not exist`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// SPECIALIZED RELATIONSHIP SERVICES
// ============================================================================

export class VlogsRelationshipService {
  private relationshipManager: RelationshipManager;
  private vlogsOps = new MockDatabaseOperations<VlogsPageContent>('vlogs_page_content');
  private carouselOps = new MockDatabaseOperations<VideoCarousel>('video_carousels');
  private videoOps = new MockDatabaseOperations<CarouselVideo>('carousel_videos');
  private albumOps = new MockDatabaseOperations<PhotoAlbum>('photo_albums');
  private photoOps = new MockDatabaseOperations<AlbumPhoto>('album_photos');
  private spotifyOps = new MockDatabaseOperations<SpotifySection>('spotify_sections');
  private playlistOps = new MockDatabaseOperations<SpotifyPlaylist>('spotify_playlists');

  constructor() {
    this.relationshipManager = new RelationshipManager();
  }

  /**
   * Get complete vlogs page with all related data
   */
  async getCompleteVlogsPage(): Promise<{
    pageContent: VlogsPageContent | null;
    carousels: Array<{
      carousel: VideoCarousel;
      videos: CarouselVideo[];
    }>;
    albums: Array<{
      album: PhotoAlbum;
      photos: AlbumPhoto[];
    }>;
    spotifySections: Array<{
      section: SpotifySection;
      playlists: SpotifyPlaylist[];
    }>;
  }> {
    const pageContent = await this.vlogsOps.findById('vlogs_1');
    
    if (!pageContent) {
      return { pageContent: null, carousels: [], albums: [], spotifySections: [] };
    }

    // Get carousels with videos
    const carouselRecords = await this.carouselOps.findMany({ vlogs_page_id: pageContent.id } as Partial<VideoCarousel>);
    const carousels = await Promise.all(
      carouselRecords.map(async carousel => ({
        carousel,
        videos: await this.videoOps.findMany({ carousel_id: carousel.id } as Partial<CarouselVideo>),
      }))
    );

    // Get albums with photos
    const albumRecords = await this.albumOps.findMany({ vlogs_page_id: pageContent.id } as Partial<PhotoAlbum>);
    const albums = await Promise.all(
      albumRecords.map(async album => ({
        album,
        photos: await this.photoOps.findMany({ album_id: album.id } as Partial<AlbumPhoto>),
      }))
    );

    // Get Spotify sections with playlists
    const spotifyRecords = await this.spotifyOps.findMany({ vlogs_page_id: pageContent.id } as Partial<SpotifySection>);
    const spotifySections = await Promise.all(
      spotifyRecords.map(async section => ({
        section,
        playlists: await this.playlistOps.findMany({ spotify_section_id: section.id } as Partial<SpotifyPlaylist>),
      }))
    );

    return { pageContent, carousels, albums, spotifySections };
  }

  /**
   * Create carousel with videos
   */
  async createCarouselWithVideos(
    carouselData: Omit<VideoCarousel, keyof BaseRecord | 'vlogs_page_id'>,
    videosData: Omit<CarouselVideo, keyof BaseRecord | 'carousel_id'>[]
  ): Promise<{ carousel: VideoCarousel; videos: CarouselVideo[] }> {
    // Create carousel
    const carousel = await this.carouselOps.create({
      ...carouselData,
      vlogs_page_id: 'vlogs_1',
    });

    // Create videos
    const videos = await Promise.all(
      videosData.map((video, index) =>
        this.videoOps.create({
          ...video,
          carousel_id: carousel.id,
          sort_order: index + 1,
        })
      )
    );

    return { carousel, videos };
  }

  /**
   * Reorder videos in a carousel
   */
  async reorderCarouselVideos(carouselId: string, videoIds: string[]): Promise<CarouselVideo[]> {
    const videos = await this.videoOps.findMany({ carousel_id: carouselId } as Partial<CarouselVideo>);
    
    // Update sort order for each video
    const updatedVideos = await Promise.all(
      videoIds.map((videoId, index) => {
        const video = videos.find(v => v.id === videoId);
        if (!video) throw new Error(`Video ${videoId} not found in carousel ${carouselId}`);
        
        return this.videoOps.update(videoId, { sort_order: index + 1 } as Partial<CarouselVideo>);
      })
    );

    return updatedVideos;
  }
}

export class RecipesRelationshipService {
  private relationshipManager: RelationshipManager;
  private recipesOps = new MockDatabaseOperations<Recipe>('recipes');

  constructor() {
    this.relationshipManager = new RelationshipManager();
  }

  /**
   * Get recipes with category grouping
   */
  async getRecipesByCategory(): Promise<Record<Recipe['recipe_category'], Recipe[]>> {
    const allRecipes = await this.recipesOps.findMany();
    
    const grouped: Record<Recipe['recipe_category'], Recipe[]> = {
      breakfast: [],
      meals: [],
      smoothies: [],
      desserts: [],
      sauces: [],
      raw: [],
      juices: [],
      drinks: [],
    };

    allRecipes.forEach(recipe => {
      grouped[recipe.recipe_category].push(recipe);
    });

    return grouped;
  }

  /**
   * Get recipe with related data
   */
  async getRecipeWithRelated(recipeId: string): Promise<{
    recipe: Recipe | null;
    relatedRecipes: Recipe[];
    categoryRecipes: Recipe[];
  }> {
    const recipe = await this.recipesOps.findById(recipeId);
    
    if (!recipe) {
      return { recipe: null, relatedRecipes: [], categoryRecipes: [] };
    }

    // Get recipes in same category
    const categoryRecipes = await this.recipesOps.findMany({ 
      recipe_category: recipe.recipe_category 
    } as Partial<Recipe>);

    // Get related recipes (same category, excluding current)
    const relatedRecipes = categoryRecipes
      .filter(r => r.id !== recipe.id)
      .slice(0, 4); // Limit to 4 related recipes

    return { recipe, relatedRecipes, categoryRecipes };
  }

  /**
   * Bulk update recipe categories
   */
  async updateRecipeCategories(updates: { recipeId: string; category: Recipe['recipe_category'] }[]): Promise<Recipe[]> {
    const updatedRecipes = await Promise.all(
      updates.map(({ recipeId, category }) =>
        this.recipesOps.update(recipeId, { recipe_category: category } as Partial<Recipe>)
      )
    );

    return updatedRecipes;
  }
}

export class StorefrontRelationshipService {
  private relationshipManager: RelationshipManager;
  private categoryOps = new MockDatabaseOperations<ProductCategory>('product_categories');
  private productOps = new MockDatabaseOperations<StorefrontProduct>('storefront_products');

  constructor() {
    this.relationshipManager = new RelationshipManager();
  }

  /**
   * Get products grouped by category
   */
  async getProductsByCategory(): Promise<Array<{
    category: ProductCategory;
    products: StorefrontProduct[];
  }>> {
    const categories = await this.categoryOps.findMany();
    
    const categoriesWithProducts = await Promise.all(
      categories.map(async category => ({
        category,
        products: await this.productOps.findMany({ category_id: category.id } as Partial<StorefrontProduct>),
      }))
    );

    return categoriesWithProducts;
  }

  /**
   * Track product click
   */
  async trackProductClick(productId: string): Promise<StorefrontProduct> {
    const product = await this.productOps.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const updatedProduct = await this.productOps.update(productId, {
      click_count: product.click_count + 1,
      last_clicked_at: new Date().toISOString(),
    } as Partial<StorefrontProduct>);

    return updatedProduct;
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(): Promise<{
    totalClicks: number;
    topProducts: Array<{ product: StorefrontProduct; clicks: number }>;
    categoryStats: Array<{ category: ProductCategory; totalClicks: number; productCount: number }>;
  }> {
    const products = await this.productOps.findMany();
    const categories = await this.categoryOps.findMany();

    const totalClicks = products.reduce((sum, product) => sum + product.click_count, 0);

    const topProducts = products
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 10)
      .map(product => ({ product, clicks: product.click_count }));

    const categoryStats = categories.map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id);
      const totalClicks = categoryProducts.reduce((sum, product) => sum + product.click_count, 0);
      
      return {
        category,
        totalClicks,
        productCount: categoryProducts.length,
      };
    });

    return { totalClicks, topProducts, categoryStats };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  RelationshipManager,
  VlogsRelationshipService,
  RecipesRelationshipService,
  StorefrontRelationshipService,
};

export type {
  RelationshipConfig,
};
