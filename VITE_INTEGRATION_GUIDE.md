# Vite Public Site Integration Guide

## 🎯 Overview
This guide outlines how to integrate your admin dashboard data with your Vite public-facing website for optimal performance and scalability.

## 📊 Performance Strategy
**Recommended Approach**: Direct Supabase Client + Smart Caching

### Why This Approach:
- ✅ **Static Generation** - Pre-fetch data at build time
- ✅ **Edge Caching** - Supabase Edge Functions for global speed  
- ✅ **Incremental Updates** - Only fetch changed content
- ✅ **Client-Side Caching** - React Query/SWR for instant navigation
- ✅ **Scalable** - Handles growing content efficiently

---

## 🏗️ Architecture Setup

### 1. Supabase Client (Public Read-Only)
```typescript
// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // Public key, read-only
)
```

### 2. Type Definitions to Copy
Copy these from your admin dashboard:
```typescript
// types/index.ts
export interface Recipe {
  id: string;
  title: string;
  description: string;
  hero_image_path: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  category: string;
  folder: string;
  isBeginner: boolean;
  isRecipeOfWeek: boolean;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  // ... etc
}

export interface VlogVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  views: string;
  duration: string;
  is_featured: boolean;
  display_order: number;
}

export interface HealingProduct {
  id: string;
  product_title: string;
  product_purpose: string;
  how_to_use: string;
  product_image_path: string;
  amazonUrl: string;
  is_active: boolean;
  product_order: number;
}

export interface StorefrontProduct {
  id: string;
  product_title: string;
  category_name: string;
  product_image_path: string;
  amazon_url: string;
  noteShort: string;
  tags: string[];
  isAlexisPick: boolean;
  showInFavorites: boolean;
  status: 'draft' | 'published' | 'archived';
}
```

---

## 🚀 Performance-Optimized Data Fetching

### Homepage (1 Background Video)
```typescript
// pages/Home.tsx
import { useQuery } from '@tanstack/react-query'

export const useHomeData = () => {
  return useQuery({
    queryKey: ['home-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('home_content')
        .select('*')
        .single()
      return data
    },
    staleTime: 60 * 60 * 1000, // Cache 1 hour - rarely changes
    cacheTime: 24 * 60 * 60 * 1000, // Keep 24 hours
  })
}
```

### Vlogs Page (YouTube Embeds - Growing Content)
```typescript
// hooks/useVlogs.ts
export const useVlogs = (limit = 12) => {
  return useQuery({
    queryKey: ['vlogs', limit],
    queryFn: async () => {
      const { data } = await supabase
        .from('vlogs')
        .select('*')
        .order('display_order', { ascending: true })
        .limit(limit)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useFeaturedVlog = () => {
  return useQuery({
    queryKey: ['featured-vlog'],
    queryFn: async () => {
      const { data } = await supabase
        .from('vlogs')
        .select('*')
        .eq('is_featured', true)
        .single()
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// For infinite scroll as content grows
export const useInfiniteVlogs = () => {
  return useInfiniteQuery({
    queryKey: ['vlogs-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await supabase
        .from('vlogs')
        .select('*')
        .order('display_order')
        .range(pageParam * 12, (pageParam + 1) * 12 - 1)
      return data
    },
    getNextPageParam: (lastPage, pages) => 
      lastPage.length === 12 ? pages.length : undefined,
  })
}
```

### Recipes Page (Heavy Growth - Search/Filter Optimized)
```typescript
// hooks/useRecipes.ts
export const useRecipes = (folder = 'all', search = '') => {
  return useQuery({
    queryKey: ['recipes', folder, search],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (folder !== 'all') {
        query = query.eq('folder', folder)
      }

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data } = await query
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - frequently updated
  })
}

export const useRecipeStats = () => {
  return useQuery({
    queryKey: ['recipe-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('recipes')
        .select('folder, isBeginner, isRecipeOfWeek')
        .eq('status', 'published')
      
      // Calculate stats client-side
      const stats = data.reduce((acc, recipe) => {
        acc.byFolder[recipe.folder] = (acc.byFolder[recipe.folder] || 0) + 1
        if (recipe.isBeginner) acc.beginners++
        if (recipe.isRecipeOfWeek) acc.recipeOfWeek++
        return acc
      }, { byFolder: {}, beginners: 0, recipeOfWeek: 0 })
      
      return stats
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

### Healing Page (Static Carousels + Products)
```typescript
// hooks/useHealing.ts
export const useHealingContent = () => {
  return useQuery({
    queryKey: ['healing-content'],
    queryFn: async () => {
      const [heroData, carouselsData, productsData] = await Promise.all([
        // Hero section
        supabase.from('healing_page_content').select('*').single(),
        
        // Carousel headers
        supabase.from('video_carousels')
          .select('*')
          .eq('page_type', 'healing')
          .order('carousel_number'),
          
        // Products
        supabase.from('healing_products')
          .select('*')
          .eq('is_active', true)
          .order('product_order')
      ])

      return {
        hero: heroData.data,
        carousels: carouselsData.data,
        products: productsData.data
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - rarely changes
  })
}
```

### Storefront Page (Product Catalog - Growing)
```typescript
// hooks/useStorefront.ts
export const useStorefrontProducts = (category = 'all', status = 'published') => {
  return useQuery({
    queryKey: ['storefront', category, status],
    queryFn: async () => {
      let query = supabase
        .from('storefront_products')
        .select('*')
        .eq('status', status)
        .order('sortWeight', { ascending: true })

      if (category !== 'all') {
        query = query.eq('category_name', category)
      }

      const { data } = await query
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useFavoriteProducts = () => {
  return useQuery({
    queryKey: ['favorite-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('storefront_products')
        .select('*')
        .eq('showInFavorites', true)
        .eq('status', 'published')
        .order('sortWeight')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

---

## 🎨 UI Components Integration

### Example: Recipe Card Component
```typescript
// components/RecipeCard.tsx
interface RecipeCardProps {
  recipe: Recipe
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={recipe.hero_image_path} 
        alt={recipe.title}
        className="w-full h-48 object-cover"
        loading="lazy" // Performance: lazy load images
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{recipe.title}</h3>
        <p className="text-gray-600 text-sm">{recipe.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            {recipe.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {recipe.prepTime} • {recipe.difficulty}
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @tanstack/react-query
```

### 2. Environment Variables
```env
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

### 3. React Query Setup
```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  )
}
```

---

## 🔧 Performance Tips

### Image Optimization
```typescript
// Use Supabase image transformations for responsive images
const getOptimizedImage = (path: string, width = 400) => {
  return `${path}?width=${width}&quality=80&format=webp`
}
```

### Prefetching
```typescript
// Prefetch next page data on hover
const prefetchRecipe = (recipeId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => getRecipeById(recipeId),
  })
}
```

### Bundle Splitting
```typescript
// Lazy load heavy pages
const RecipesPage = lazy(() => import('./pages/Recipes'))
const HealingPage = lazy(() => import('./pages/Healing'))
```

---

## 🚀 Deployment Optimizations

### Static Generation (if using Vite SSG)
```typescript
// Pre-generate popular content at build time
export const getStaticPaths = async () => {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('slug')
    .eq('status', 'published')
    .limit(50) // Top 50 recipes
    
  return recipes.map(recipe => ({ params: { slug: recipe.slug } }))
}
```

### CDN Caching
- Set long cache headers for images (1 year)
- Set shorter cache for API responses (5-15 minutes)
- Use Supabase Edge Functions for global distribution

---

## 📋 Migration Checklist

- [ ] Copy type definitions from admin dashboard
- [ ] Set up Supabase client with public key
- [ ] Install React Query and configure
- [ ] Create data fetching hooks for each page
- [ ] Implement lazy loading for images
- [ ] Add infinite scroll for growing content (vlogs, recipes)
- [ ] Set up proper caching strategies
- [ ] Test performance with large datasets
- [ ] Configure bundle splitting for code optimization

---

## 🔗 Database Relationships

Your Supabase tables are already optimized:
- `recipes` - Main recipe content
- `vlogs` - Video data with YouTube URLs  
- `healing_products` - Product recommendations
- `healing_page_content` - Hero video content
- `video_carousels` - Healing section carousels
- `storefront_products` - Product catalog
- `home_content` - Homepage background video

All tables have proper indexing for performance and are ready for production scaling.

---

*This guide ensures your public site will be lightning-fast and scale beautifully as your content grows!*