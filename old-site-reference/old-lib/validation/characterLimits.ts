/**
 * Character Limits Configuration
 * 
 * Based on typography analysis and responsive design constraints:
 * - Mobile viewport: 375px
 * - Desktop viewport: 1920px  
 * - Typography: Fluid clamp() scaling
 * - Container: max-w-7xl (80rem = 1280px) with padding
 * - Content width: 75ch for paragraphs
 */

export const CONTENT_LIMITS = {
  // HOME PAGE
  home: {
    heroTitle: 65,        // "text-3xl sm:text-4xl md:text-6xl" - Large display text, 1-2 lines max
    heroSubtitle: 35,     // "text-lg sm:text-xl md:text-2xl" - Single line preferred
    copyright: 25,        // "text-sm" - Single line footer text
    navigationButton: 20, // Button text needs to fit in grid layout
  },

  // VLOGS PAGE  
  vlogs: {
    // Hero Section
    heroMainTitle: 20,       // "text-2xl sm:text-3xl lg:text-5xl" - Single impactful word
    heroMainSubtitle: 60,    // "text-sm sm:text-base lg:text-lg" - One engaging sentence
    heroBodyParagraph: 280,  // "text-sm sm:text-base lg:text-lg" - 3-4 sentences max
    
    // Featured Video Card
    heroVideoTitle: 80,      // Video card title - 2 lines max
    heroVideoSubtitle: 120,  // Video card description - 2-3 lines
    
    // Carousel Videos
    videoTitle: 70,          // "text-sm font-semibold" - 2 lines in carousel cards
    videoDescription: 100,   // "text-xs line-clamp-1" - Brief description
    
    // Photo Albums
    albumTitle: 40,          // Album overlay title - 1-2 lines
    albumDescription: 80,    // Album subtitle - 2 lines max
    photoCaption: 60,        // Individual photo captions
    
    // Spotify Section
    spotifyTitle: 50,        // Section title
    spotifySubtitle: 100,    // Section subtitle
    playlistTitle: 40,       // Playlist name with emojis
    playlistBodyText: 80,    // Playlist description
    playlistMoodPill: 15,    // Mood pill text (e.g., "Chill Vibes")
  },

  // RECIPES & TUTORIALS PAGE
  recipes: {
    // Hero Section
    heroTitle: 30,           // "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl" - Page title
    heroSubtitle: 80,        // "font-semibold" - Key message
    heroBodyParagraph: 350,  // "text-sm sm:text-base lg:text-base xl:text-lg" - Longer description
    
    // Recipe Videos
    recipeVideoTitle: 50,    // YouTube reel titles in carousel
    
    // Recipe Content
    recipeName: 60,          // Recipe titles in cards and modals
    recipeDescription: 150,  // Recipe descriptions
    recipeIngredient: 100,   // Individual ingredient line
    recipeInstruction: 200,  // Individual instruction step
    recipeCategory: 20,      // Category pills (e.g., "Breakfast")
    
    // Section Headers
    sectionTitle: 40,        // "text-2xl font-bold" - Section headers
    sectionSubtitle: 80,     // Section descriptions
  },

  // HEALING PAGE
  healing: {
    // Hero Section  
    heroHeader: 15,          // "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl" - Page title
    heroSubtitle: 60,        // "font-semibold" - Key message
    heroBodyParagraph: 300,  // Main description paragraph
    
    // Hero Video Card
    heroVideoTitle: 80,      // Featured video title
    heroVideoSubtitle: 120,  // Featured video description
    
    // Carousel Sections
    carouselHeader: 30,      // "text-3xl font-bold" - Carousel section titles
    carouselSubtitle: 40,    // Carousel section subtitles
    
    // Video Content
    videoTitle: 70,          // Individual video titles in carousels
    videoSubtitle: 120,      // Individual video descriptions
    
    // Product Cards
    productTitle: 60,        // "text-xl font-semibold" - Product names
    productPurpose: 150,     // Product purpose description
    productHowToUse: 200,    // Usage instructions
  },

  // AMAZON STOREFRONT PAGE
  storefront: {
    // My Favorites Carousel
    productTitle: 70,        // Product names in carousel
    productDescription: 120, // Product descriptions/taglines
    categoryPill: 20,        // Category pills (e.g., "Food", "Healing")
    
    // Category Sections
    categoryName: 25,        // Category section names
    categoryDescription: 100, // Category descriptions
  },

  // GENERAL LIMITS (for shared components)
  general: {
    // Meta/SEO
    metaTitle: 60,           // Page titles for SEO
    metaDescription: 160,    // Meta descriptions
    
    // Navigation
    menuItem: 25,            // Navigation menu items
    breadcrumb: 30,          // Breadcrumb items
    
    // Form Fields
    shortText: 100,          // Short form fields
    mediumText: 250,         // Medium form fields  
    longText: 500,           // Long form fields/textareas
    
    // Common Elements
    buttonText: 25,          // Button labels
    tagText: 20,             // Tags and pills
    tooltipText: 80,         // Tooltip content
    alertText: 200,          // Alert/notification messages
  }
} as const;

/**
 * Validation helper functions
 */
export const validateLength = (text: string, limit: number): boolean => {
  return text.length <= limit;
};

export const getCharacterCount = (text: string): number => {
  return text.length;
};

export const getRemainingCharacters = (text: string, limit: number): number => {
  return Math.max(0, limit - text.length);
};

export const getValidationStatus = (text: string, limit: number): 'success' | 'warning' | 'error' => {
  const length = text.length;
  const percentage = (length / limit) * 100;
  
  if (length > limit) return 'error';
  if (percentage >= 90) return 'warning';
  return 'success';
};

/**
 * Character limit validation messages
 */
export const getValidationMessage = (text: string, limit: number, fieldName: string): string | null => {
  const length = text.length;
  
  if (length > limit) {
    return `${fieldName} must be ${limit} characters or less (currently ${length})`;
  }
  
  if (length === 0) {
    return null; // Don't show message for empty fields
  }
  
  const remaining = getRemainingCharacters(text, limit);
  const percentage = (length / limit) * 100;
  
  if (percentage >= 90) {
    return `${remaining} characters remaining`;
  }
  
  return null;
};

/**
 * Get limit for specific content type
 */
export const getContentLimit = (section: keyof typeof CONTENT_LIMITS, field: string): number => {
  const sectionLimits = CONTENT_LIMITS[section];
  if (sectionLimits && field in sectionLimits) {
    return sectionLimits[field as keyof typeof sectionLimits] as number;
  }
  
  // Fallback to general limits
  if (field in CONTENT_LIMITS.general) {
    return CONTENT_LIMITS.general[field as keyof typeof CONTENT_LIMITS.general] as number;
  }
  
  // Default fallback
  return CONTENT_LIMITS.general.mediumText;
};

/**
 * Content type mappings for easy reference
 */
export const CONTENT_TYPE_LIMITS = {
  // Home page mappings
  'home.hero.title': CONTENT_LIMITS.home.heroTitle,
  'home.hero.subtitle': CONTENT_LIMITS.home.heroSubtitle,
  'home.copyright': CONTENT_LIMITS.home.copyright,
  'home.navigation.button': CONTENT_LIMITS.home.navigationButton,
  
  // Vlogs page mappings
  'vlogs.hero.mainTitle': CONTENT_LIMITS.vlogs.heroMainTitle,
  'vlogs.hero.mainSubtitle': CONTENT_LIMITS.vlogs.heroMainSubtitle,
  'vlogs.hero.bodyParagraph': CONTENT_LIMITS.vlogs.heroBodyParagraph,
  'vlogs.hero.videoTitle': CONTENT_LIMITS.vlogs.heroVideoTitle,
  'vlogs.hero.videoSubtitle': CONTENT_LIMITS.vlogs.heroVideoSubtitle,
  'vlogs.video.title': CONTENT_LIMITS.vlogs.videoTitle,
  'vlogs.video.description': CONTENT_LIMITS.vlogs.videoDescription,
  'vlogs.album.title': CONTENT_LIMITS.vlogs.albumTitle,
  'vlogs.album.description': CONTENT_LIMITS.vlogs.albumDescription,
  'vlogs.photo.caption': CONTENT_LIMITS.vlogs.photoCaption,
  'vlogs.spotify.title': CONTENT_LIMITS.vlogs.spotifyTitle,
  'vlogs.spotify.subtitle': CONTENT_LIMITS.vlogs.spotifySubtitle,
  'vlogs.playlist.title': CONTENT_LIMITS.vlogs.playlistTitle,
  'vlogs.playlist.bodyText': CONTENT_LIMITS.vlogs.playlistBodyText,
  'vlogs.playlist.moodPill': CONTENT_LIMITS.vlogs.playlistMoodPill,
  
  // Recipes page mappings
  'recipes.hero.title': CONTENT_LIMITS.recipes.heroTitle,
  'recipes.hero.subtitle': CONTENT_LIMITS.recipes.heroSubtitle,
  'recipes.hero.bodyParagraph': CONTENT_LIMITS.recipes.heroBodyParagraph,
  'recipes.video.title': CONTENT_LIMITS.recipes.recipeVideoTitle,
  'recipes.recipe.name': CONTENT_LIMITS.recipes.recipeName,
  'recipes.recipe.description': CONTENT_LIMITS.recipes.recipeDescription,
  'recipes.recipe.ingredient': CONTENT_LIMITS.recipes.recipeIngredient,
  'recipes.recipe.instruction': CONTENT_LIMITS.recipes.recipeInstruction,
  'recipes.recipe.category': CONTENT_LIMITS.recipes.recipeCategory,
  'recipes.section.title': CONTENT_LIMITS.recipes.sectionTitle,
  'recipes.section.subtitle': CONTENT_LIMITS.recipes.sectionSubtitle,
  
  // Healing page mappings
  'healing.hero.header': CONTENT_LIMITS.healing.heroHeader,
  'healing.hero.subtitle': CONTENT_LIMITS.healing.heroSubtitle,
  'healing.hero.bodyParagraph': CONTENT_LIMITS.healing.heroBodyParagraph,
  'healing.hero.videoTitle': CONTENT_LIMITS.healing.heroVideoTitle,
  'healing.hero.videoSubtitle': CONTENT_LIMITS.healing.heroVideoSubtitle,
  'healing.carousel.header': CONTENT_LIMITS.healing.carouselHeader,
  'healing.carousel.subtitle': CONTENT_LIMITS.healing.carouselSubtitle,
  'healing.video.title': CONTENT_LIMITS.healing.videoTitle,
  'healing.video.subtitle': CONTENT_LIMITS.healing.videoSubtitle,
  'healing.product.title': CONTENT_LIMITS.healing.productTitle,
  'healing.product.purpose': CONTENT_LIMITS.healing.productPurpose,
  'healing.product.howToUse': CONTENT_LIMITS.healing.productHowToUse,
  
  // Storefront page mappings
  'storefront.product.title': CONTENT_LIMITS.storefront.productTitle,
  'storefront.product.description': CONTENT_LIMITS.storefront.productDescription,
  'storefront.category.pill': CONTENT_LIMITS.storefront.categoryPill,
  'storefront.category.name': CONTENT_LIMITS.storefront.categoryName,
  'storefront.category.description': CONTENT_LIMITS.storefront.categoryDescription,
} as const;
