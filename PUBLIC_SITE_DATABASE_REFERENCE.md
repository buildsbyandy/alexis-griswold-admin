# Public Site Database Integration Reference

## 🎯 Purpose
This reference helps AI assistants verify and update the public website (alexisgriswold.com) to ensure it's properly connected to the Supabase database with the correct field mappings.

## ⚠️ Critical Changes Made to Database Schema

### 1. Recipe Status Field Change (BREAKING CHANGE)
- **OLD**: `isPublished: boolean` 
- **NEW**: `status: 'draft' | 'published' | 'archived'`
- **Impact**: All recipe queries on public site must be updated

### 2. Database Field Names (Should Already Work)
The database uses snake_case, but public site should map to camelCase:
- `hero_image_path` → `imageUrl` in frontend
- `product_title` → `title` in frontend  
- `amazon_url` → `amazonUrl` in frontend
- `category_name` → `category` in frontend

---

## 🔍 What to Check on Public Site

### Environment Variables
```env
# .env (should exist)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

### Supabase Client Setup
```typescript
// lib/supabase.ts or similar
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 🚨 Required Query Updates

### RECIPES - Critical Fix Needed
**OLD (Will Break)**:
```typescript
// ❌ This will return no results
const { data } = await supabase
  .from('recipes')
  .select('*')
  .eq('isPublished', true)  // This field no longer exists!
```

**NEW (Required)**:
```typescript
// ✅ Correct query
const { data } = await supabase
  .from('recipes')
  .select('*')
  .eq('status', 'published')  // Use new status enum
```

### STOREFRONT PRODUCTS - Critical Fix Needed
**OLD (Will Break)**:
```typescript
// ❌ This will return no results  
const { data } = await supabase
  .from('storefront_products')
  .select('*')
  .eq('isPublished', true)  // This field no longer exists!
```

**NEW (Required)**:
```typescript
// ✅ Correct query
const { data } = await supabase
  .from('storefront_products')
  .select('*')
  .eq('status', 'published')  // Use new status enum
```

---

## 📋 Database Tables & Expected Fields

### Table: `recipes`
**Fields to Query:**
```typescript
{
  id: string
  title: string
  description: string
  hero_image_path: string  // Maps to imageUrl in frontend
  category: string
  folder: string
  ingredients: string[]    // JSON array
  instructions: string[]   // JSON array
  tags: string[]          // JSON array
  prep_time: string
  cook_time: string
  servings: number
  difficulty: string
  is_beginner: boolean
  is_recipe_of_week: boolean
  is_favorite: boolean
  status: 'draft' | 'published' | 'archived'  // NEW FIELD
  created_at: timestamp
  updated_at: timestamp
}
```

### Table: `vlogs`
**Fields to Query:**
```typescript
{
  id: string
  title: string
  description: string
  youtube_url: string
  thumbnail_url: string
  published_at: string
  views: string
  duration: string
  is_featured: boolean
  display_order: number
  created_at: timestamp
}
```

### Table: `storefront_products`  
**Fields to Query:**
```typescript
{
  id: string
  product_title: string    // Maps to title in frontend
  category_name: string    // Maps to category in frontend
  product_image_path: string // Maps to imageUrl in frontend
  amazon_url: string       // Maps to amazonUrl in frontend
  note_short: string
  tags: string[]          // JSON array
  is_alexis_pick: boolean
  show_in_favorites: boolean
  sort_weight: number
  price: string           // NEW FIELD
  status: 'draft' | 'published' | 'archived'  // NEW FIELD
  created_at: timestamp
  updated_at: timestamp
}
```

### Table: `healing_products`
**Fields to Query:**
```typescript
{
  id: string
  product_title: string
  product_purpose: string
  how_to_use: string
  product_image_path: string
  product_link: string     // Amazon affiliate link
  is_active: boolean
  product_order: number
  created_at: timestamp
}
```

### Table: `video_carousels`
**Fields to Query:**
```typescript
{
  id: string
  page_type: 'healing' | 'vlogs'
  carousel_number: number
  carousel_title: string
  carousel_subtitle: string
  created_at: timestamp
}
```

### Table: `carousel_videos`
**Fields to Query:**
```typescript
{
  id: string
  carousel_id: string     // Foreign key to video_carousels
  video_title: string
  video_description: string
  youtube_url: string
  video_order: number
  created_at: timestamp
}
```

### Table: `home_content`
**Fields to Query:**
```typescript
{
  id: string
  hero_video_youtube_url: string
  hero_video_date: string
  hero_video_title: string
  hero_video_description: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Table: `healing_page_content`
**Fields to Query:**
```typescript
{
  id: string
  hero_video_youtube_url: string
  hero_video_date: string
  hero_video_title: string
  hero_video_description: string
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🎯 Pages That Need Database Queries

### 1. Homepage (`/`)
- **Table**: `home_content`
- **Query**: Get hero video data
- **Fields**: `hero_video_youtube_url`, `hero_video_title`, `hero_video_description`

### 2. Vlogs Page (`/vlogs`)
- **Table**: `vlogs`  
- **Query**: Get published vlogs with pagination
- **Fields**: All fields, no status filter needed (vlogs don't have status field)

### 3. Recipes Page (`/recipes`)
- **Table**: `recipes`
- **Query**: Get published recipes by folder/category
- **⚠️ CRITICAL**: Must filter by `status = 'published'`

### 4. Healing Page (`/healing`)
- **Tables**: `healing_page_content`, `video_carousels`, `carousel_videos`, `healing_products`
- **Query**: Get hero content, carousels, and active products
- **Fields**: Hero video data, carousel data, active products

### 5. Storefront Page (`/storefront`)
- **Table**: `storefront_products`
- **Query**: Get published products by category
- **⚠️ CRITICAL**: Must filter by `status = 'published'`

---

## 🔧 Common Issues to Fix

### Issue 1: No Data Showing
**Cause**: Using old `isPublished` field
**Fix**: Change to `status = 'published'`

### Issue 2: Wrong Field Names
**Cause**: Using camelCase field names in queries
**Fix**: Use snake_case database field names

### Issue 3: Environment Variables Missing
**Cause**: Missing Supabase credentials
**Fix**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue 4: Caching Issues  
**Cause**: Browser/CDN cache showing old data
**Fix**: Clear cache, add cache-busting parameters

---

## 🚀 Performance Recommendations

### Caching Strategy
```typescript
// Use React Query for caching
const { data: recipes } = useQuery({
  queryKey: ['recipes', folder, status],
  queryFn: () => fetchRecipes(folder, status),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
})
```

### Pagination for Large Tables
```typescript
// For recipes and storefront products
const { data } = await supabase
  .from('recipes')
  .select('*')
  .eq('status', 'published')
  .range(0, 11) // First 12 items
  .order('created_at', { ascending: false })
```

---

## ✅ Testing Checklist

- [ ] Homepage shows hero video from `home_content`
- [ ] Vlogs page shows YouTube videos from `vlogs` table
- [ ] Recipes page shows only published recipes (`status = 'published'`)
- [ ] Healing page shows content from multiple tables
- [ ] Storefront shows only published products (`status = 'published'`)
- [ ] All images load correctly using `*_image_path` fields
- [ ] Search functionality works with new field names
- [ ] No console errors related to database queries
- [ ] Data updates when admin dashboard makes changes

---

## 🎯 AI Assistant Instructions

When checking the public website, look for:

1. **Database connection**: Verify Supabase client setup
2. **Query updates**: Check for `isPublished` → `status` changes
3. **Field mappings**: Ensure snake_case database fields are used
4. **Error handling**: Look for failed queries or 404 responses
5. **Performance**: Check for proper caching and pagination

If the public site is still showing old/cached data, the primary issue is likely the `status` field migration that needs to be applied there.