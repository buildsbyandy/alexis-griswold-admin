/**
 * CMS Mock Data Structure
 * 
 * This file contains all the structured data that should be editable through the CMS.
 * It replaces hardcoded content throughout the application with a centralized data structure.
 */

// ===== HOME PAGE DATA =====
export interface HomePageData {
  backgroundVideo: {
    desktopVideoUrl: string;
    fallbackImageUrl: string;
  };
  hero: {
    mainTitle: string;
    subtitle: string;
  };
  navigation: {
    buttons: Array<{
      text: string;
      href: string;
    }>;
  };
  copyright: string;
}

export const homePageData: HomePageData = {
  backgroundVideo: {
    desktopVideoUrl: "/alexisHome.mp4",
    fallbackImageUrl: "/test_1.jpg"
  },
  hero: {
    mainTitle: "Elevate your mind, body and spirit",
    subtitle: "with Alexis Griswold"
  },
  navigation: {
    buttons: [
      { text: "Vlogs", href: "/vlogs" },
      { text: "Recipes & Tutorials", href: "/recipes" },
      { text: "Healing", href: "/healing" },
      { text: "Store Front", href: "/store" }
    ]
  },
  copyright: "© Alexis Griswold"
};

// ===== VLOGS PAGE DATA =====
export interface VlogVideo {
  id: string;
  youtubeUrl: string;
  title: string;
  subtitle?: string;
  date: string;
  thumbnailOverride?: string;
}

export interface VlogCarousel {
  title: string;
  videos: VlogVideo[];
}

export interface PhotoAlbum {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  coverImageUrl: string;
  photos: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
  }>;
}

export interface SpotifyPlaylist {
  id: string;
  title: string;
  bodyText: string;
  moodPill: string;
  cardColor: string;
  spotifyUrl: string;
}

export interface VlogsPageData {
  hero: {
    youtubeUrl: string;
    videoTitle: string;
    subtitle: string;
    date: string;
    mainTitle: string;
    mainSubtitle: string;
    bodyParagraph: string;
  };
  carousels: {
    carousel1: VlogCarousel;
    carousel2: VlogCarousel;
  };
  photoAlbums: PhotoAlbum[];
  spotifySection: {
    title: string;
    subtitle: string;
    playlists: SpotifyPlaylist[];
  };
}

export const vlogsPageData: VlogsPageData = {
  hero: {
    youtubeUrl: "https://www.youtube.com/watch?v=MYmmbSZ4YaQ",
    videoTitle: "Morning Routine & Healthy Breakfast",
    subtitle: "Start your day with energy and intention",
    date: "2024-01-15",
    mainTitle: "VLOGS",
    mainSubtitle: "Step into my life — one video at a time.",
    bodyParagraph: "Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary."
  },
  carousels: {
    carousel1: {
      title: "Main Channel",
      videos: [
        {
          id: "6AvOegDnEb0",
          youtubeUrl: "https://www.youtube.com/watch?v=6AvOegDnEb0",
          title: "Raw Vegan Meal Prep",
          subtitle: "Simple and delicious plant-based meals",
          date: "2024-01-12"
        },
        {
          id: "qBXducGwqxY",
          youtubeUrl: "https://www.youtube.com/watch?v=qBXducGwqxY",
          title: "Travel Vlog: Arizona Adventures",
          subtitle: "Exploring the beautiful desert landscapes",
          date: "2024-01-08"
        },
        {
          id: "JFgukuIduPs",
          youtubeUrl: "https://www.youtube.com/watch?v=JFgukuIduPs",
          title: "Smoothie Bowl Tutorial",
          subtitle: "How to make Instagram-worthy smoothie bowls",
          date: "2024-01-05"
        },
        {
          id: "1qilUaxl5Ss",
          youtubeUrl: "https://www.youtube.com/watch?v=1qilUaxl5Ss",
          title: "Self-Care Sunday Routine",
          subtitle: "Nurturing mind, body, and soul",
          date: "2024-01-01"
        },
        {
          id: "j43tVo2Y07E",
          youtubeUrl: "https://www.youtube.com/watch?v=j43tVo2Y07E",
          title: "Kitchen Organization Tips",
          subtitle: "Creating a functional and beautiful space",
          date: "2023-12-28"
        }
      ]
    },
    carousel2: {
      title: "AG Vlogs",
      videos: [
        {
          id: "JAV_AgwUNzI",
          youtubeUrl: "https://www.youtube.com/watch?v=JAV_AgwUNzI",
          title: "Personal Vlog: Daily Reflections",
          subtitle: "Thoughts on mindfulness and personal growth",
          date: "2024-01-15"
        },
        {
          id: "DYGGRHpSMOs",
          youtubeUrl: "https://www.youtube.com/watch?v=DYGGRHpSMOs",
          title: "Personal Vlog: Wellness Journey",
          subtitle: "Exploring holistic health and wellness practices",
          date: "2024-01-12"
        },
        {
          id: "NrjqEH0tghQ",
          youtubeUrl: "https://www.youtube.com/watch?v=NrjqEH0tghQ",
          title: "Personal Vlog: Mindful Living",
          subtitle: "Simple practices for a more intentional life",
          date: "2024-01-10"
        },
        {
          id: "5lNcMk0-owo",
          youtubeUrl: "https://www.youtube.com/watch?v=5lNcMk0-owo",
          title: "Personal Vlog: Spiritual Growth",
          subtitle: "Deepening connection with mind, body, and spirit",
          date: "2024-01-08"
        },
        {
          id: "FU2g2fUrdpE",
          youtubeUrl: "https://www.youtube.com/watch?v=FU2g2fUrdpE",
          title: "Personal Vlog: Life Lessons",
          subtitle: "Sharing insights and wisdom from daily experiences",
          date: "2024-01-05"
        }
      ]
    }
  },
  photoAlbums: [
    {
      id: "1",
      title: "Morning Rituals",
      subtitle: "Start your day with intention",
      date: "2024-01-15",
      coverImageUrl: "/img1.JPEG",
      photos: [
        { id: "1", url: "/img1.JPEG", alt: "Morning coffee ritual", caption: "Coffee time" },
        { id: "2", url: "/img2.JPG", alt: "Kitchen workspace", caption: "Preparing breakfast" }
      ]
    },
    {
      id: "2",
      title: "Desert Adventures",
      subtitle: "Exploring Arizona landscapes",
      date: "2024-01-10",
      coverImageUrl: "/img3.jpg",
      photos: [
        { id: "3", url: "/img3.jpg", alt: "Desert sunset", caption: "Golden hour" }
      ]
    },
    {
      id: "3",
      title: "Healthy Creations",
      subtitle: "Plant-based meal prep",
      date: "2024-01-08",
      coverImageUrl: "/img4.JPG",
      photos: [
        { id: "4", url: "/img4.JPG", alt: "Smoothie bowl creation", caption: "Berry bowl" },
        { id: "5", url: "/img5.JPG", alt: "Yoga session", caption: "Mindful movement" }
      ]
    },
    {
      id: "4",
      title: "Wellness Journey",
      subtitle: "Mind, body, and soul care",
      date: "2024-01-05",
      coverImageUrl: "/img6.jpg",
      photos: [
        { id: "6", url: "/img6.jpg", alt: "Grocery shopping", caption: "Fresh ingredients" },
        { id: "7", url: "/img7.JPG", alt: "Recipe testing", caption: "Kitchen experiments" }
      ]
    },
    {
      id: "5",
      title: "Home Sweet Home",
      subtitle: "Creating beautiful spaces",
      date: "2024-01-03",
      coverImageUrl: "/test_1.JPG",
      photos: [
        { id: "8", url: "/test_1.JPG", alt: "Nature walk", caption: "Outdoor time" }
      ]
    },
    {
      id: "6",
      title: "Fitness & Movement",
      subtitle: "Staying active and energized",
      date: "2024-01-01",
      coverImageUrl: "/test_1.JPG",
      photos: [
        { id: "9", url: "/test_1.JPG", alt: "Meal prep session", caption: "Weekly prep" },
        { id: "10", url: "/test_1.JPG", alt: "Reading time", caption: "Learning moments" }
      ]
    }
  ],
  spotifySection: {
    title: "Listen to My Playlists",
    subtitle: "Curated music for every mood and moment",
    playlists: [
      {
        id: "1",
        title: "🌅 Switching Timezones 🌇",
        bodyText: "Perfect for travel and transitions",
        moodPill: "Chill Vibes",
        cardColor: "#2D2D2D",
        spotifyUrl: "https://open.spotify.com/playlist/4i1BwxDwkjbJNGvhnhEH5P"
      },
      {
        id: "2",
        title: "🏵️ Soulmates 🏵️",
        bodyText: "Music for deep connections",
        moodPill: "Energy Boost",
        cardColor: "#E91429",
        spotifyUrl: "https://open.spotify.com/playlist/4Bp1HuaVuGrjJRz10hWfkf"
      },
      {
        id: "3",
        title: "🏖️ Ready 4 Summer 💦",
        bodyText: "Summer vibes all year round",
        moodPill: "Feel Good",
        cardColor: "#1E3A8A",
        spotifyUrl: "https://open.spotify.com/playlist/7uZas1QudcmrU21IUtwd5Q"
      }
    ]
  }
};

// ===== RECIPES & TUTORIALS PAGE DATA =====
export interface RecipeVideo {
  id: string;
  youtubeUrl: string;
  title: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: "Breakfast" | "Meals" | "Smoothies" | "Desserts" | "Sauces" | "Raw" | "Juices" | "Drinks";
  description: string;
  ingredients: string[];
  instructions: string[];
  images: string[];
}

export interface RecipesPageData {
  hero: {
    title: string;
    subtitle: string;
    bodyParagraph: string;
  };
  heroCarousel: RecipeVideo[];
  recipes: Recipe[];
}

export const recipesPageData: RecipesPageData = {
  hero: {
    title: "RECIPES & TUTORIALS",
    subtitle: "Living with passion, energy, and confidence starts from within.",
    bodyParagraph: "The recipes and rituals I share here are the foundation of how I fuel my body, mind, and spirit everyday. Every smoothie, every meal, and every moment of self-care is designed to support a vibrant, fast-paced life where you feel light, alive, and ready for anything. This is more than food and tutorials, this is a lifestyle rooted in vitality."
  },
  heroCarousel: [
    {
      id: "cCBFC74nBo4",
      youtubeUrl: "https://www.youtube.com/watch?v=cCBFC74nBo4",
      title: "Recipe Tutorial 1"
    },
    {
      id: "nrJr-T049Ak",
      youtubeUrl: "https://www.youtube.com/watch?v=nrJr-T049Ak",
      title: "Recipe Tutorial 2"
    },
    {
      id: "tCC0hCcN-4E",
      youtubeUrl: "https://www.youtube.com/watch?v=tCC0hCcN-4E",
      title: "Recipe Tutorial 3"
    },
    {
      id: "NYq4qGThwgM",
      youtubeUrl: "https://www.youtube.com/watch?v=NYq4qGThwgM",
      title: "Recipe Tutorial 4"
    },
    {
      id: "b4fDGZ5M9r8",
      youtubeUrl: "https://www.youtube.com/watch?v=b4fDGZ5M9r8",
      title: "Recipe Tutorial 5"
    }
  ],
  recipes: [
    {
      id: "banana-smoothie-bowl",
      name: "Banana Smoothie Bowl",
      category: "Breakfast",
      description: "A creamy and nutritious smoothie bowl topped with fresh fruits",
      ingredients: ["2 frozen bananas", "1/2 cup almond milk", "1 tbsp almond butter", "Mixed berries", "Granola", "Coconut flakes"],
      instructions: ["Blend frozen bananas with almond milk until smooth", "Add almond butter and blend again", "Pour into bowl", "Top with berries, granola, and coconut flakes"],
      images: ["/recipes/Bananasmoothiebowl/1.WEBP", "/recipes/Bananasmoothiebowl/2.WEBP"]
    },
    {
      id: "garden-salad",
      name: "Garden Salad",
      category: "Meals",
      description: "Fresh and crisp salad with seasonal vegetables",
      ingredients: ["Mixed greens", "Cherry tomatoes", "Cucumber", "Carrots", "Olive oil", "Lemon juice", "Salt", "Pepper"],
      instructions: ["Wash and chop all vegetables", "Mix greens in large bowl", "Add vegetables", "Drizzle with olive oil and lemon juice", "Season with salt and pepper"],
      images: ["/recipes/GardenSalad/1.WEBP", "/recipes/GardenSalad/2.WEBP"]
    }
  ]
};

// ===== HEALING PAGE DATA =====
export interface HealingVideo {
  id: string;
  youtubeUrl: string;
  title: string;
  subtitle: string;
  date: string;
}

export interface HealingProduct {
  id: string;
  imageUrl: string;
  title: string;
  purpose: string;
  howToUse: string;
  amazonUrl: string;
}

export interface HealingPageData {
  hero: {
    header: string;
    subtitle: string;
    bodyParagraph: string;
    videoCard: HealingVideo;
  };
  carousels: {
    carousel1: {
      header: string;
      subtitle: string;
      videos: HealingVideo[];
    };
    carousel2: {
      header: string;
      subtitle: string;
      videos: HealingVideo[];
    };
  };
  products: HealingProduct[];
}

export const healingPageData: HealingPageData = {
  hero: {
    header: "HEALING",
    subtitle: "Your journey to wellness starts here.",
    bodyParagraph: "From gut health to holistic healing, discover natural methods to restore your body's balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body's innate healing wisdom.",
    videoCard: {
      id: "dQw4w9WgXcQ",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Healing Journey Introduction",
      subtitle: "Your journey to wellness starts here",
      date: "2024-01-15"
    }
  },
  carousels: {
    carousel1: {
      header: "Gut Healing Part 1",
      subtitle: "Candida Cleanse",
      videos: [
        {
          id: "candida-video-1",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Candida Cleanse Introduction",
          subtitle: "Understanding candida overgrowth and natural cleansing methods",
          date: "2024-01-15"
        },
        {
          id: "candida-video-2",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Anti-Candida Diet Plan",
          subtitle: "Complete meal plan to eliminate candida naturally",
          date: "2024-01-20"
        },
        {
          id: "candida-video-3",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Candida Die-Off Symptoms",
          subtitle: "How to manage and reduce die-off symptoms during cleanse",
          date: "2024-01-25"
        },
        {
          id: "candida-video-4",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Natural Antifungal Supplements",
          subtitle: "Best supplements to support candida elimination",
          date: "2024-02-01"
        }
      ]
    },
    carousel2: {
      header: "Gut Healing Part 2",
      subtitle: "Rebuild & Repair",
      videos: [
        {
          id: "rebuild-video-1",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Gut Microbiome Restoration",
          subtitle: "Rebuilding healthy gut bacteria after candida cleanse",
          date: "2024-02-10"
        },
        {
          id: "rebuild-video-2",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Probiotic Foods Guide",
          subtitle: "Best probiotic-rich foods to restore gut health",
          date: "2024-02-15"
        },
        {
          id: "rebuild-video-3",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Healing Leaky Gut",
          subtitle: "Natural methods to repair intestinal permeability",
          date: "2024-02-20"
        },
        {
          id: "rebuild-video-4",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Post-Cleanse Maintenance",
          subtitle: "Long-term strategies to maintain gut health",
          date: "2024-02-25"
        }
      ]
    }
  },
  products: [
    {
      id: "probiotic-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Garden of Life Probiotics",
      purpose: "Restore healthy gut bacteria and support immune function",
      howToUse: "Take 1 capsule daily with food, preferably in the morning",
      amazonUrl: "https://amazon.com/placeholder-probiotic-1"
    },
    {
      id: "collagen-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Vital Proteins Collagen",
      purpose: "Support gut lining repair and promote skin health",
      howToUse: "Mix 1-2 scoops into coffee, smoothies, or water daily",
      amazonUrl: "https://amazon.com/placeholder-collagen-1"
    },
    {
      id: "digestive-enzyme-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Enzymedica Digest Gold",
      purpose: "Improve nutrient absorption and reduce digestive discomfort",
      howToUse: "Take 1-2 capsules with each meal as needed",
      amazonUrl: "https://amazon.com/placeholder-enzyme-1"
    },
    {
      id: "l-glutamine-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Pure Encapsulations L-Glutamine",
      purpose: "Repair intestinal lining and reduce inflammation",
      howToUse: "Take 5g powder mixed in water on empty stomach",
      amazonUrl: "https://amazon.com/placeholder-glutamine-1"
    },
    {
      id: "aloe-vera-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Lily of the Desert Aloe Vera",
      purpose: "Soothe digestive tract and support natural healing",
      howToUse: "Take 2-4 oz daily, preferably before meals",
      amazonUrl: "https://amazon.com/placeholder-aloe-1"
    },
    {
      id: "omega-3-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Nordic Naturals Omega-3",
      purpose: "Reduce inflammation and support brain-gut connection",
      howToUse: "Take 2 softgels daily with food",
      amazonUrl: "https://amazon.com/placeholder-omega-1"
    }
  ]
};

// ===== AMAZON STOREFRONT PAGE DATA =====
export interface StorefrontProduct {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  categoryPill: string;
  amazonUrl: string;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  products: StorefrontProduct[];
}

export interface StorefrontPageData {
  myFavorites: StorefrontProduct[];
  categories: StorefrontCategory[];
}

export const storefrontPageData: StorefrontPageData = {
  myFavorites: [
    {
      id: "food-1",
      imageUrl: "/products/food_1.jpeg",
      title: "Yellowbird Organic Sriracha Hot Sauce",
      description: "My favorite go-to sauce for tacos!",
      categoryPill: "Food",
      amazonUrl: "https://www.amazon.com/dp/B09JB56QSX"
    },
    {
      id: "healing-1",
      imageUrl: "/products/healing_1.jpg",
      title: "Castor Oil",
      description: "A staple in my natural healing toolkit.",
      categoryPill: "Healing",
      amazonUrl: "https://www.amazon.com/dp/B0734849YK"
    },
    {
      id: "home-1",
      imageUrl: "/products/home_1.jpg",
      title: "Emergency Stain Rescue Spray",
      description: "Works wonders on tough stains!",
      categoryPill: "Home",
      amazonUrl: "https://www.amazon.com/dp/B01LX1RIEV"
    },
    {
      id: "personal-1",
      imageUrl: "/products/personal_1.jpg",
      title: "By Rosie Jane Eau De Parfum (Missy)",
      description: "My signature scent for everyday wear.",
      categoryPill: "Personal Care",
      amazonUrl: "https://www.amazon.com/dp/B0CXQ7148C"
    }
  ],
  categories: [
    {
      id: "food",
      name: "Food",
      products: [
        {
          id: "food-1",
          imageUrl: "/products/food_1.jpeg",
          title: "Yellowbird Organic Sriracha Hot Sauce",
          description: "My favorite go-to sauce for tacos!",
          categoryPill: "Food",
          amazonUrl: "https://www.amazon.com/dp/B09JB56QSX"
        }
      ]
    },
    {
      id: "healing",
      name: "Healing",
      products: [
        {
          id: "healing-1",
          imageUrl: "/products/healing_1.jpg",
          title: "Castor Oil",
          description: "A staple in my natural healing toolkit.",
          categoryPill: "Healing",
          amazonUrl: "https://www.amazon.com/dp/B0734849YK"
        }
      ]
    },
    {
      id: "home",
      name: "Home",
      products: [
        {
          id: "home-1",
          imageUrl: "/products/home_1.jpg",
          title: "Emergency Stain Rescue Spray",
          description: "Works wonders on tough stains!",
          categoryPill: "Home",
          amazonUrl: "https://www.amazon.com/dp/B01LX1RIEV"
        }
      ]
    },
    {
      id: "personal-care",
      name: "Personal Care",
      products: [
        {
          id: "personal-1",
          imageUrl: "/products/personal_1.jpg",
          title: "By Rosie Jane Eau De Parfum (Missy)",
          description: "My signature scent for everyday wear.",
          categoryPill: "Personal Care",
          amazonUrl: "https://www.amazon.com/dp/B0CXQ7148C"
        }
      ]
    }
  ]
};
