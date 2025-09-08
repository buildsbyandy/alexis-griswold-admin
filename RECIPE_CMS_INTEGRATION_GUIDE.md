# Recipe CMS Integration Guide for Public Site

## Overview
This document outlines the changes made to the admin CMS and Supabase database structure to enable dynamic recipe page content management. The public site should be updated to fetch content from these new APIs instead of using hardcoded data from `cmsData.ts`.

---

## 🗄️ Database Schema Changes

The following Supabase tables are now fully implemented and populated via the admin CMS:

### `recipes_page_content` Table
**Purpose:** Manages the hero section content on the recipes page

```sql
-- Enhanced fields added:
ALTER TABLE recipes_page_content ADD COLUMN hero_background_image text;
ALTER TABLE recipes_page_content ADD COLUMN hero_cta_text text;
ALTER TABLE recipes_page_content ADD COLUMN hero_cta_url text;
ALTER TABLE recipes_page_content ADD COLUMN beginner_section_title text DEFAULT 'Just Starting Out';
ALTER TABLE recipes_page_content ADD COLUMN beginner_section_subtitle text DEFAULT 'Simple recipes for beginners';
ALTER TABLE recipes_page_content ADD COLUMN show_beginner_section boolean DEFAULT true;
ALTER TABLE recipes_page_content ADD COLUMN page_seo_title text;
ALTER TABLE recipes_page_content ADD COLUMN page_seo_description text;
```

**Contains:**
- `hero_title` - Main page heading (e.g., "RECIPES & TUTORIALS")
- `hero_subtitle` - Supporting text under title
- `hero_body_paragraph` - Detailed description text
- `hero_background_image` - Optional hero background
- `hero_cta_text` / `hero_cta_url` - Call-to-action button
- Beginner section configuration
- SEO metadata

### `recipe_hero_videos` Table
**Purpose:** Manages YouTube Reels/Shorts carousel in hero section

```sql
-- Enhanced fields added:
ALTER TABLE recipe_hero_videos ADD COLUMN video_thumbnail_url text;
ALTER TABLE recipe_hero_videos ADD COLUMN video_description text;
ALTER TABLE recipe_hero_videos ADD COLUMN is_active boolean DEFAULT true;
ALTER TABLE recipe_hero_videos ADD COLUMN video_type text DEFAULT 'reel';
```

**Contains:**
- `youtube_url` - Full YouTube video URL
- `video_title` - Display title (auto-extracted if empty)
- `video_order` - Display order in carousel
- `video_thumbnail_url` - Auto-generated thumbnail
- `is_active` - Whether to show on public site
- `video_type` - Type classification (reel, tutorial, short)

### `recipes` Table (Enhanced Usage)
**Purpose:** Individual recipes with enhanced filtering

**Key Fields for Public Site:**
- `isBeginner` - Boolean flag for "Just Starting Out" carousel
- `isRecipeOfWeek` - Featured recipe highlighting  
- `status` - published/draft filtering
- `is_favorite` - Additional filtering option

---

## 🔌 New API Endpoints Available

The admin site now provides these endpoints for the public site to consume:

### 1. Recipe Page Content
```
GET /api/recipes/page-content
```

**Response Format:**
```json
{
  "content": {
    "hero_title": "RECIPES & TUTORIALS",
    "hero_subtitle": "Living with passion, energy, and confidence starts from within.",
    "hero_body_paragraph": "The recipes and rituals I share here...",
    "hero_background_image": null,
    "hero_cta_text": null,
    "hero_cta_url": null,
    "beginner_section_title": "Just Starting Out",
    "beginner_section_subtitle": "Simple recipes for beginners",
    "show_beginner_section": true,
    "page_seo_title": "Recipes & Tutorials - Alexis Griswold",
    "page_seo_description": "Discover vibrant recipes and wellness tutorials..."
  }
}
```

### 2. Hero Videos Carousel
```
GET /api/recipes/hero-videos
```

**Response Format:**
```json
{
  "videos": [
    {
      "id": "uuid",
      "youtube_url": "https://www.youtube.com/shorts/abc123",
      "video_title": "Quick Morning Smoothie",
      "video_order": 1,
      "video_thumbnail_url": "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
      "is_active": true,
      "video_type": "reel",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Beginner Recipes (Existing Enhanced)
```
GET /api/recipes?filter=beginner
```
Filter existing recipes API by `isBeginner=true` for carousel content.

---

## 📝 Public Site Integration Tasks

### Replace Hardcoded Content

**Current State (in `cmsData.ts`):**
```javascript
// Lines 330-356: Hardcoded recipe reels
export const recipeReels = [
  {
    id: 'reel1',
    title: 'Quick Morning Smoothie',
    videoUrl: 'https://www.youtube.com/shorts/...'
  }
  // ... more hardcoded data
]

// Lines 165-206: Hardcoded recipe carousel
export const starterRecipes = [
  {
    id: 'green-detox',
    title: 'Green Detox Juice',
    // ... hardcoded recipe data
  }
]

// Hardcoded hero content
export const recipesPageData = {
  heroTitle: 'RECIPES & TUTORIALS',
  heroSubtitle: 'Living with passion, energy, and confidence...',
  // ... hardcoded content
}
```

**New Dynamic Implementation:**

1. **Replace Hero Content:**
```javascript
// Create new service: lib/services/recipePageService.js
export const getRecipePageContent = async () => {
  const response = await fetch(`${API_BASE_URL}/api/recipes/page-content`);
  if (!response.ok) throw new Error('Failed to fetch recipe page content');
  return response.json();
};
```

2. **Replace Hero Videos:**
```javascript
export const getHeroVideos = async () => {
  const response = await fetch(`${API_BASE_URL}/api/recipes/hero-videos`);
  if (!response.ok) throw new Error('Failed to fetch hero videos');
  const data = await response.json();
  return data.videos.filter(video => video.is_active);
};
```

3. **Replace Beginner Carousel:**
```javascript
export const getBeginnerRecipes = async () => {
  const response = await fetch(`${API_BASE_URL}/api/recipes?filter=beginner`);
  if (!response.ok) throw new Error('Failed to fetch beginner recipes');
  const data = await response.json();
  return data.recipes.filter(recipe => recipe.isBeginner && recipe.status === 'published');
};
```

### Update Recipe Page Component

**In your public site's recipe page component:**

```javascript
import { useEffect, useState } from 'react';
import { getRecipePageContent, getHeroVideos, getBeginnerRecipes } from '../services/recipePageService';

export default function RecipesPage() {
  const [pageContent, setPageContent] = useState(null);
  const [heroVideos, setHeroVideos] = useState([]);
  const [beginnerRecipes, setBeginnerRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [content, videos, recipes] = await Promise.all([
          getRecipePageContent(),
          getHeroVideos(),
          getBeginnerRecipes()
        ]);
        
        setPageContent(content.content);
        setHeroVideos(videos);
        setBeginnerRecipes(recipes);
      } catch (error) {
        console.error('Error loading recipe page data:', error);
        // Fallback to hardcoded data if needed
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>{pageContent?.hero_title || 'RECIPES & TUTORIALS'}</h1>
        <p>{pageContent?.hero_subtitle || 'Default subtitle...'}</p>
        <p>{pageContent?.hero_body_paragraph || 'Default body text...'}</p>
        
        {/* Hero Videos Carousel */}
        <div className="video-carousel">
          {heroVideos.map(video => (
            <div key={video.id} className="video-item">
              <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(video.youtube_url)}`} />
              <h3>{video.video_title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Beginner Recipes Carousel */}
      {pageContent?.show_beginner_section && (
        <section className="beginner-recipes">
          <h2>{pageContent?.beginner_section_title || 'Just Starting Out'}</h2>
          <p>{pageContent?.beginner_section_subtitle || 'Simple recipes for beginners'}</p>
          
          <div className="recipe-carousel">
            {beginnerRecipes.slice(0, 6).map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <img src={recipe.imageUrl} alt={recipe.title} />
                <h3>{recipe.title}</h3>
                <p>{recipe.category}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 🔧 Environment Configuration

**Required Environment Variables:**
```env
# In your public site's .env file
NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-site.vercel.app
# OR 
VITE_ADMIN_API_URL=https://your-admin-site.vercel.app
```

**API Base URL Setup:**
```javascript
// lib/config.js
export const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                           import.meta.env.VITE_ADMIN_API_URL || 
                           'http://localhost:3000';
```

---

## ✅ Migration Checklist

- [ ] Set up API service functions for recipe page content
- [ ] Replace hardcoded hero content with API calls  
- [ ] Replace hardcoded video carousel with API data
- [ ] Replace hardcoded beginner recipes with filtered API data
- [ ] Add loading states and error handling
- [ ] Test with admin CMS to ensure content updates appear on public site
- [ ] Add fallback content for when APIs are unavailable
- [ ] Update SEO meta tags using `page_seo_title` and `page_seo_description`
- [ ] Remove unused hardcoded data from `cmsData.ts`

---

## 🎯 Benefits of This Integration

1. **Dynamic Content:** Recipe page content now editable via admin CMS
2. **Real-time Updates:** Changes in admin appear immediately on public site
3. **Better UX:** Beginner recipes automatically populate from database
4. **SEO Control:** Page metadata manageable through admin
5. **Video Management:** YouTube carousel easily maintained by content team
6. **Consistent Data:** Single source of truth in Supabase database

---

## 🆘 Troubleshooting

**Common Issues:**
- **CORS errors:** Ensure admin API allows requests from public site domain
- **Missing data:** Check that content exists in admin CMS before public site calls
- **API timeouts:** Add proper error handling and fallback content
- **YouTube embeds:** Verify video URLs are public and embeddable

**Fallback Strategy:**
Keep existing hardcoded data as fallback when APIs fail:
```javascript
const content = apiContent || fallbackContent;
```

This ensures the public site continues working even if the admin API is temporarily unavailable.