/**
 * Mock Database Implementation
 * 
 * Provides mock data and CRUD operations that match the planned database schema.
 * This allows development to continue while preparing for Supabase integration.
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
  RecipeCategory,
  HealingPageContent,
  HealingCarousel,
  HealingVideo,
  HealingProduct,
  StorefrontPageContent,
  ProductCategory,
  StorefrontProduct,
  FavoritesCarousel,
  FavoriteProduct,
  DatabaseOperations,
  ApiResponse,
  PaginatedResponse,
} from '../../types/database';

// ============================================================================
// MOCK DATA STORE
// ============================================================================

class MockDataStore {
  private static instance: MockDataStore;
  private data: Record<string, Record<string, any>> = {};

  static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore();
      MockDataStore.instance.initializeData();
    }
    return MockDataStore.instance;
  }

  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeData(): void {
    // Initialize with mock data matching the current CMS structure
    this.data = {
      home_content: {
        'home_1': {
          id: 'home_1',
          background_video_path: '/alexisHome.mp4',
          background_image_path: '/test_1.jpg',
          hero_main_title: 'Elevate your mind, body and spirit',
          hero_subtitle: 'with Alexis Griswold',
          copyright_text: '© Alexis Griswold',
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as HomeContent,
      },
      navigation_buttons: {
        'nav_1': {
          id: 'nav_1',
          home_content_id: 'home_1',
          button_text: 'Vlogs',
          button_href: '/vlogs',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as NavigationButton,
        'nav_2': {
          id: 'nav_2',
          home_content_id: 'home_1',
          button_text: 'Recipes & Tutorials',
          button_href: '/recipes',
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as NavigationButton,
        'nav_3': {
          id: 'nav_3',
          home_content_id: 'home_1',
          button_text: 'Healing',
          button_href: '/healing',
          sort_order: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as NavigationButton,
        'nav_4': {
          id: 'nav_4',
          home_content_id: 'home_1',
          button_text: 'Store Front',
          button_href: '/store',
          sort_order: 4,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as NavigationButton,
      },
      vlogs_page_content: {
        'vlogs_1': {
          id: 'vlogs_1',
          hero_main_title: 'VLOGS',
          hero_main_subtitle: 'Step into my life — one video at a time.',
          hero_body_paragraph: 'Every moment captured, every story shared, every experience lived with intention. From morning rituals to spontaneous adventures, these vlogs offer you a window into my world. Join me as I navigate life with curiosity, authenticity, and a commitment to growth. Whether I\'m exploring new places, trying new recipes, or sharing the lessons I\'m learning along the way, each video is an invitation to connect, reflect, and maybe discover something new about yourself too.',
          hero_youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          hero_video_title: 'My Latest Adventure',
          hero_video_subtitle: 'Join me on this incredible journey',
          hero_video_date: '2024-01-15',
          youtube_channel_url: 'https://www.youtube.com/@Alexisgriswoldvlogs',
          tiktok_profile_url: 'https://www.tiktok.com/@alexisgriswoldd',
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as VlogsPageContent,
      },
      video_carousels: {
        'carousel_1': {
          id: 'carousel_1',
          vlogs_page_id: 'vlogs_1',
          carousel_name: 'Featured Videos',
          carousel_subtitle: 'My latest and greatest content',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as VideoCarousel,
      },
      carousel_videos: {
        'video_1': {
          id: 'video_1',
          carousel_id: 'carousel_1',
          youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          video_title: 'Raw Vegan Meal Prep',
          video_description: 'Simple and delicious plant-based meals',
          thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: '10:30',
          sort_order: 1,
          is_featured: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as CarouselVideo,
      },
      photo_albums: {
        'album_1': {
          id: 'album_1',
          vlogs_page_id: 'vlogs_1',
          album_title: 'Morning Rituals',
          album_subtitle: 'Start your day with intention',
          album_description: 'A collection of my favorite morning practices',
          album_date: '2024-01-10',
          cover_image_path: '/albums/morning-rituals-cover.jpg',
          sort_order: 1,
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as PhotoAlbum,
      },
      album_photos: {
        'photo_1': {
          id: 'photo_1',
          album_id: 'album_1',
          image_path: '/albums/morning-rituals/photo-1.jpg',
          photo_caption: 'Morning meditation in the garden',
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as AlbumPhoto,
      },
      spotify_sections: {
        'spotify_1': {
          id: 'spotify_1',
          vlogs_page_id: 'vlogs_1',
          section_title: 'My Spotify Playlists',
          section_subtitle: 'Music that moves me',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as SpotifySection,
      },
      spotify_playlists: {
        'playlist_1': {
          id: 'playlist_1',
          spotify_section_id: 'spotify_1',
          playlist_title: '🌅 Switching Timezones 🌇',
          playlist_body_text: 'Perfect for travel and transitions',
          mood_pill_text: 'Chill Vibes',
          card_color_hex: '#FF6B6B',
          spotify_url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
          sort_order: 1,
          is_featured: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as SpotifyPlaylist,
      },
      recipes_page_content: {
        'recipes_1': {
          id: 'recipes_1',
          hero_title: 'RECIPES & TUTORIALS',
          hero_subtitle: 'Living with passion, energy, and confidence starts from within.',
          hero_body_paragraph: 'The recipes and rituals I share here are more than just food—they\'re a pathway to nourishing your body, mind, and spirit. Each dish is crafted with intention, using whole, plant-based ingredients that fuel your vitality and support your wellbeing. From energizing smoothie bowls to comforting healing soups, these recipes are designed to help you feel your absolute best while honoring the connection between what we eat and how we feel.',
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as RecipesPageContent,
      },
      recipe_hero_carousel: {
        'hero_video_1': {
          id: 'hero_video_1',
          recipes_page_id: 'recipes_1',
          youtube_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
          video_title: 'Quick Smoothie Bowl',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as RecipeHeroCarousel,
      },
      recipes: {
        'recipe_1': {
          id: 'recipe_1',
          recipe_name: 'Banana Smoothie Bowl',
          recipe_description: 'A creamy and nutritious smoothie bowl topped with fresh fruits',
          recipe_category: 'breakfast',
          recipe_label: 'Beginner Friendly',
          ingredients: [
            '2 frozen bananas',
            '1/4 cup almond milk',
            '1 tbsp almond butter',
            'Fresh berries for topping',
            'Granola for crunch'
          ],
          instructions: [
            'Blend frozen bananas with almond milk until smooth',
            'Add almond butter and blend again',
            'Pour into bowl and add toppings',
            'Enjoy immediately'
          ],
          recipe_images: ['/recipes/banana-smoothie-bowl-1.jpg'],
          is_beginner_friendly: true,
          is_featured: true,
          is_published: true,
          slug: 'banana-smoothie-bowl',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Recipe,
      },
      recipe_categories: {
        'cat_1': {
          id: 'cat_1',
          category_id: 'breakfast',
          category_name: 'Breakfast',
          category_icon: '🥞',
          category_description: 'Start your day right',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as RecipeCategory,
      },
      healing_page_content: {
        'healing_1': {
          id: 'healing_1',
          hero_header: 'HEALING',
          hero_subtitle: 'Your journey to wellness starts here.',
          hero_body_paragraph: 'From gut health to holistic healing, discover the tools and wisdom that have transformed my relationship with my body and wellbeing. These aren\'t quick fixes—they\'re sustainable practices rooted in science, ancient wisdom, and personal experience. Whether you\'re dealing with digestive issues, seeking more energy, or simply wanting to optimize your health, this collection of resources will guide you toward feeling your absolute best.',
          hero_video_youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          hero_video_title: 'My Healing Journey',
          hero_video_subtitle: 'How I transformed my health naturally',
          hero_video_date: '2024-01-20',
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as HealingPageContent,
      },
      healing_products: {
        'product_1': {
          id: 'product_1',
          healing_page_id: 'healing_1',
          product_title: 'Garden of Life Probiotics',
          product_purpose: 'Restore healthy gut bacteria and support immune function',
          product_how_to_use: 'Take 1 capsule daily with food, preferably in the morning',
          product_link_url: 'https://amazon.com/garden-of-life-probiotics',
          product_image_path: '/healing/products/probiotics.jpg',
          sort_order: 1,
          is_featured: true,
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as HealingProduct,
      },
      storefront_page_content: {
        'storefront_1': {
          id: 'storefront_1',
          page_title: 'Amazon Storefront',
          page_description: 'My favorite products and recommendations',
          is_published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as StorefrontPageContent,
      },
      product_categories: {
        'cat_food': {
          id: 'cat_food',
          category_name: 'Food',
          category_description: 'Kitchen essentials and healthy food products',
          category_slug: 'food',
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as ProductCategory,
      },
      storefront_products: {
        'product_sf_1': {
          id: 'product_sf_1',
          product_title: 'Yellowbird Organic Sriracha Hot Sauce',
          product_description: 'My favorite go-to sauce for tacos!',
          amazon_url: 'https://amazon.com/yellowbird-sriracha',
          product_image_path: '/amazon/products/yellowbird-sriracha.jpg',
          category_id: 'cat_food',
          category_pill_text: 'Food',
          click_count: 0,
          last_clicked_at: null,
          is_featured: true,
          is_published: true,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as StorefrontProduct,
      },
    };
  }

  // Generic CRUD operations
  findById<T extends BaseRecord>(table: string, id: string): T | null {
    return (this.data[table]?.[id] as T) || null;
  }

  findMany<T extends BaseRecord>(table: string, filters?: Partial<T>): T[] {
    const records = Object.values(this.data[table] || {}) as T[];
    
    if (!filters) return records;

    return records.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        return (record as any)[key] === value;
      });
    });
  }

  create<T extends BaseRecord>(table: string, data: Omit<T, keyof BaseRecord>): T {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const record = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    } as T;

    if (!this.data[table]) {
      this.data[table] = {};
    }
    
    this.data[table][id] = record;
    return record;
  }

  update<T extends BaseRecord>(table: string, id: string, data: Partial<T>): T | null {
    const existing = this.data[table]?.[id];
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    } as T;

    this.data[table][id] = updated;
    return updated;
  }

  delete(table: string, id: string): boolean {
    if (!this.data[table]?.[id]) return false;
    delete this.data[table][id];
    return true;
  }
}

// ============================================================================
// MOCK DATABASE OPERATIONS
// ============================================================================

export class MockDatabaseOperations<T extends BaseRecord> implements DatabaseOperations<T> {
  constructor(private tableName: string) {}

  async findById(id: string): Promise<T | null> {
    await this.simulateDelay();
    return MockDataStore.getInstance().findById<T>(this.tableName, id);
  }

  async findMany(filters?: Partial<T>): Promise<T[]> {
    await this.simulateDelay();
    return MockDataStore.getInstance().findMany<T>(this.tableName, filters);
  }

  async create(data: Omit<T, keyof BaseRecord>): Promise<T> {
    await this.simulateDelay();
    return MockDataStore.getInstance().create<T>(this.tableName, data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.simulateDelay();
    const result = MockDataStore.getInstance().update<T>(this.tableName, id, data);
    if (!result) {
      throw new Error(`Record with id ${id} not found`);
    }
    return result;
  }

  async delete(id: string): Promise<boolean> {
    await this.simulateDelay();
    return MockDataStore.getInstance().delete(this.tableName, id);
  }

  private async simulateDelay(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
  }
}

// ============================================================================
// SPECIALIZED OPERATIONS FOR COMPLEX RELATIONSHIPS
// ============================================================================

export class MockHomeContentService {
  private homeOps = new MockDatabaseOperations<HomeContent>('home_content');
  private navOps = new MockDatabaseOperations<NavigationButton>('navigation_buttons');

  async getHomeContent(): Promise<{
    content: HomeContent | null;
    navigationButtons: NavigationButton[];
  }> {
    const content = await this.homeOps.findById('home_1');
    const navigationButtons = content 
      ? await this.navOps.findMany({ home_content_id: content.id } as Partial<NavigationButton>)
      : [];

    return { content, navigationButtons };
  }

  async updateHomeContent(
    contentData: Partial<HomeContent>,
    navigationButtons: Omit<NavigationButton, keyof BaseRecord | 'home_content_id'>[]
  ): Promise<HomeContent> {
    // Update main content
    const updatedContent = await this.homeOps.update('home_1', contentData);

    // Delete existing navigation buttons
    const existingButtons = await this.navOps.findMany({ home_content_id: 'home_1' } as Partial<NavigationButton>);
    await Promise.all(existingButtons.map(btn => this.navOps.delete(btn.id)));

    // Create new navigation buttons
    await Promise.all(
      navigationButtons.map((btn, index) =>
        this.navOps.create({
          ...btn,
          home_content_id: 'home_1',
          sort_order: index + 1,
          is_active: true,
        })
      )
    );

    return updatedContent;
  }
}

export class MockPhotoAlbumService {
  private albumOps = new MockDatabaseOperations<PhotoAlbum>('photo_albums');
  private photoOps = new MockDatabaseOperations<AlbumPhoto>('album_photos');

  async getAlbumWithPhotos(albumId: string): Promise<{
    album: PhotoAlbum | null;
    photos: AlbumPhoto[];
  }> {
    const album = await this.albumOps.findById(albumId);
    const photos = album 
      ? await this.photoOps.findMany({ album_id: albumId } as Partial<AlbumPhoto>)
      : [];

    return { album, photos };
  }

  async createAlbumWithPhotos(
    albumData: Omit<PhotoAlbum, keyof BaseRecord | 'vlogs_page_id'>,
    photosData: Omit<AlbumPhoto, keyof BaseRecord | 'album_id'>[]
  ): Promise<{ album: PhotoAlbum; photos: AlbumPhoto[] }> {
    // Create album
    const album = await this.albumOps.create({
      ...albumData,
      vlogs_page_id: 'vlogs_1',
    });

    // Create photos
    const photos = await Promise.all(
      photosData.map((photo, index) =>
        this.photoOps.create({
          ...photo,
          album_id: album.id,
          sort_order: index + 1,
        })
      )
    );

    return { album, photos };
  }
}

export class MockRecipeService {
  private recipeOps = new MockDatabaseOperations<Recipe>('recipes');

  async getRecipesByCategory(category: Recipe['recipe_category']): Promise<Recipe[]> {
    return this.recipeOps.findMany({ recipe_category: category } as Partial<Recipe>);
  }

  async getBeginnerRecipes(): Promise<Recipe[]> {
    return this.recipeOps.findMany({ is_beginner_friendly: true } as Partial<Recipe>);
  }

  async getFeaturedRecipes(): Promise<Recipe[]> {
    return this.recipeOps.findMany({ is_featured: true } as Partial<Recipe>);
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const allRecipes = await this.recipeOps.findMany();
    const lowerQuery = query.toLowerCase();

    return allRecipes.filter(recipe => 
      recipe.recipe_name.toLowerCase().includes(lowerQuery) ||
      recipe.recipe_description?.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(lowerQuery))
    );
  }
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export class MockApiHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return { data, message };
  }

  static error(error: string): ApiResponse<never> {
    return { error };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MockDataStore,
  MockDatabaseOperations,
  MockHomeContentService,
  MockPhotoAlbumService,
  MockRecipeService,
  MockApiHelper,
};
