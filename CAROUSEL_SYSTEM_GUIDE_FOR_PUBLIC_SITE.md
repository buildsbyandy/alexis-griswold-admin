# Carousel System Integration Guide for Public Vite Website

## Overview
This guide explains how to query and display carousel data from Supabase in the public-facing Vite website. The carousel system is the primary way content is curated and displayed across different pages.

---

## Database Architecture

### Three Key Components

#### 1. `carousels` Table
Defines the **containers** for content on each page.

```sql
-- Key fields:
- id: uuid (primary key)
- page: enum ('vlogs', 'recipes', 'storefront', 'healing', 'home')
- slug: text (e.g., 'vlogs-featured', 'recipes-beginner')
- title: text (optional display title)
- description: text (optional)
- is_active: boolean
```

**Purpose:** Each carousel represents a specific section on your website. For example:
- `vlogs-featured` → Featured videos section on vlogs page
- `vlogs-spotify-playlists` → Spotify playlists section on vlogs page
- `storefront-favorites` → Favorite products section on storefront page

#### 2. `carousel_items` Table
Contains the **actual items** in each carousel with their ordering and metadata.

```sql
-- Key fields:
- id: uuid (primary key)
- carousel_id: uuid (links to carousels table)
- kind: enum ('video', 'album', 'recipe', 'product', 'playlist', 'external', 'tiktok')
- order_index: integer (for sorting)
- is_active: boolean
- ref_id: uuid (points to content in other tables - recipes, products, etc.)
- youtube_id: text (for video items)
- album_id: uuid (for photo album items)
- link_url: text (for external/tiktok items)
- caption: text (optional override caption)
- image_path: text (optional override image)
- badge: text (optional badge like "NEW" or "FEATURED")
- is_featured: boolean (marks special featured items)
```

**Important:** The `kind` field determines which other field contains the actual content reference:
- `kind: 'video'` → uses `youtube_id`
- `kind: 'album'` → uses `album_id`
- `kind: 'recipe'` → uses `ref_id` (references `recipes.id`)
- `kind: 'product'` → uses `ref_id` (references `storefront_products.id`)
- `kind: 'playlist'` → uses `ref_id` (references `spotify_playlists.id`)
- `kind: 'external'` or `'tiktok'` → uses `link_url`

See `types/kind_field.md` for the complete field mapping.

#### 3. `v_carousel_items` View (DO NOT USE IN PUBLIC SITE)
A database view that joins `carousel_items` with `carousels` and other tables, adding `item_` prefix to fields.

**⚠️ IMPORTANT:** The public site should **NOT** query this view directly. This view is used internally by the admin dashboard and has prefixed column names that don't match the actual table structure.

---

## How to Query Carousel Data (Public Site)

### Step 1: Query `carousel_items` for a Specific Carousel

```javascript
// Example: Get featured videos for vlogs page
const { data: carouselData, error: carouselError } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'vlogs')
  .eq('slug', 'vlogs-featured')
  .single();

if (carouselError || !carouselData) {
  console.error('Carousel not found');
  return;
}

// Get the items in this carousel
const { data: items, error: itemsError } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carouselData.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });
```

### Step 2: Fetch Referenced Content Based on `kind`

After getting carousel items, you need to fetch the actual content they reference:

```javascript
// Filter items by kind
const videoItems = items.filter(item => item.kind === 'video');
const recipeItems = items.filter(item => item.kind === 'recipe');
const playlistItems = items.filter(item => item.kind === 'playlist');

// Fetch video metadata
const youtubeIds = videoItems.map(item => item.youtube_id).filter(Boolean);
const { data: vlogs } = await supabase
  .from('vlogs')
  .select('*')
  .in('youtube_id', youtubeIds);

// Fetch recipe metadata
const recipeIds = recipeItems.map(item => item.ref_id).filter(Boolean);
const { data: recipes } = await supabase
  .from('recipes')
  .select('*')
  .in('id', recipeIds);

// Fetch playlist metadata
const playlistIds = playlistItems.map(item => item.ref_id).filter(Boolean);
const { data: playlists } = await supabase
  .from('spotify_playlists')
  .select('*')
  .in('id', playlistIds);
```

### Step 3: Combine and Display

```javascript
// Create a map for easy lookup
const vlogMap = new Map(vlogs.map(v => [v.youtube_id, v]));
const recipeMap = new Map(recipes.map(r => [r.id, r]));
const playlistMap = new Map(playlists.map(p => [p.id, p]));

// Combine carousel items with their content
const displayItems = items.map(item => {
  let content = null;

  if (item.kind === 'video' && item.youtube_id) {
    content = vlogMap.get(item.youtube_id);
  } else if (item.kind === 'recipe' && item.ref_id) {
    content = recipeMap.get(item.ref_id);
  } else if (item.kind === 'playlist' && item.ref_id) {
    content = playlistMap.get(item.ref_id);
  }

  if (!content) return null;

  return {
    id: item.id,
    kind: item.kind,
    order_index: item.order_index,
    badge: item.badge,
    is_featured: item.is_featured,
    // Use carousel item overrides if present, otherwise use content defaults
    caption: item.caption || content.title || content.playlist_title,
    image: item.image_path || content.thumbnail_url || content.thumbnail_path || content.cover_image_path,
    ...content // Spread the full content object
  };
}).filter(Boolean);

// Items are already sorted by order_index from the query
```

---

## Common Patterns

### Pattern 1: Featured Section (Single Carousel)
```javascript
async function getFeaturedVideos() {
  // 1. Find carousel by page + slug
  const { data: carousel } = await supabase
    .from('carousels')
    .select('id')
    .eq('page', 'vlogs')
    .eq('slug', 'vlogs-featured')
    .single();

  // 2. Get active items, sorted by order
  const { data: items } = await supabase
    .from('carousel_items')
    .select('*')
    .eq('carousel_id', carousel.id)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  // 3. Fetch referenced content and combine
  // (see Step 2 & 3 above)
}
```

### Pattern 2: Multiple Carousels on One Page
```javascript
async function getVlogsPageData() {
  // Get all vlogs carousels
  const { data: carousels } = await supabase
    .from('carousels')
    .select('*')
    .eq('page', 'vlogs')
    .eq('is_active', true);

  // For each carousel, get its items
  const carouselData = await Promise.all(
    carousels.map(async (carousel) => {
      const { data: items } = await supabase
        .from('carousel_items')
        .select('*')
        .eq('carousel_id', carousel.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      return {
        carousel,
        items
      };
    })
  );

  // Then fetch all referenced content in batch and combine
}
```

### Pattern 3: Get a Single Featured Item
```javascript
async function getFeaturedVlog() {
  // Find the featured carousel
  const { data: carousel } = await supabase
    .from('carousels')
    .select('id')
    .eq('page', 'vlogs')
    .eq('slug', 'vlogs-featured')
    .single();

  // Get the item marked as featured
  const { data: item } = await supabase
    .from('carousel_items')
    .select('*')
    .eq('carousel_id', carousel.id)
    .eq('is_featured', true)
    .eq('is_active', true)
    .single();

  // Fetch the vlog content
  if (item?.youtube_id) {
    const { data: vlog } = await supabase
      .from('vlogs')
      .select('*')
      .eq('youtube_id', item.youtube_id)
      .single();

    return { ...vlog, badge: item.badge };
  }
}
```

---

## Important Field Mappings

### Always Use NON-PREFIXED Fields from `carousel_items`:
```javascript
// ✅ CORRECT (carousel_items table fields)
item.id
item.kind
item.ref_id
item.order_index
item.is_active
item.caption
item.image_path

// ❌ WRONG (these are only in v_carousel_items view)
item.carousel_item_id  // NO
item.item_kind         // NO
item.item_ref_id       // NO
item.item_order_index  // NO
item.item_caption      // NO
```

---

## Content Tables Reference

### For `kind: 'video'`
```sql
Table: vlogs
Match on: youtube_id
Key fields: id, title, description, youtube_url, thumbnail_url, published_at
```

### For `kind: 'recipe'`
```sql
Table: recipes
Match on: ref_id → recipes.id
Key fields: id, recipe_title, description, card_image_path, prep_time, cook_time
```

### For `kind: 'product'`
```sql
Table: storefront_products
Match on: ref_id → storefront_products.id
Key fields: id, product_title, description, image_path, amazon_url, price
```

### For `kind: 'playlist'`
```sql
Table: spotify_playlists
Match on: ref_id → spotify_playlists.id
Key fields: id, playlist_title, description, thumbnail_path, spotify_url, card_color, use_color_overlay
```

### For `kind: 'album'`
```sql
Table: photo_albums
Match on: album_id → photo_albums.id
Key fields: id, album_title, album_description, cover_image_path, page_type
```

### For `kind: 'external'` or `kind: 'tiktok'`
No additional table needed - use `link_url` directly from carousel_items

---

## Performance Tips

1. **Batch queries**: Fetch all carousel items first, then batch-fetch all referenced content
2. **Use `.in()` queries**: Instead of multiple single queries, use `in()` with arrays of IDs
3. **Cache carousels**: Carousel structure rarely changes, consider caching the carousel → slug mappings
4. **Index properly**: Queries on `carousel_id`, `is_active`, and `order_index` are optimized

---

## Example: Complete Vlogs Featured Section

```javascript
async function getVlogsFeaturedSection() {
  try {
    // Step 1: Get the carousel
    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .select('id, title, description')
      .eq('page', 'vlogs')
      .eq('slug', 'vlogs-featured')
      .single();

    if (carouselError) throw carouselError;

    // Step 2: Get carousel items
    const { data: items, error: itemsError } = await supabase
      .from('carousel_items')
      .select('*')
      .eq('carousel_id', carousel.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (itemsError) throw itemsError;

    // Step 3: Extract youtube IDs and fetch vlogs
    const youtubeIds = items
      .filter(item => item.kind === 'video' && item.youtube_id)
      .map(item => item.youtube_id);

    const { data: vlogs, error: vlogsError } = await supabase
      .from('vlogs')
      .select('*')
      .in('youtube_id', youtubeIds);

    if (vlogsError) throw vlogsError;

    // Step 4: Create lookup map and combine
    const vlogMap = new Map(vlogs.map(v => [v.youtube_id, v]));

    const displayItems = items
      .map(item => {
        const vlog = vlogMap.get(item.youtube_id);
        if (!vlog) return null;

        return {
          id: item.id,
          carouselItemId: item.id,
          vlogId: vlog.id,
          title: item.caption || vlog.title,
          description: vlog.description,
          youtubeUrl: vlog.youtube_url,
          thumbnailUrl: item.image_path || vlog.thumbnail_url,
          badge: item.badge,
          isFeatured: item.is_featured,
          publishedAt: vlog.published_at,
          orderIndex: item.order_index
        };
      })
      .filter(Boolean);

    return {
      carousel: {
        title: carousel.title,
        description: carousel.description
      },
      items: displayItems
    };
  } catch (error) {
    console.error('Error fetching vlogs featured section:', error);
    return { carousel: null, items: [] };
  }
}
```

---

## RLS (Row Level Security) Notes

The public site should have read-only access to these tables:
- ✅ `carousels` (SELECT only)
- ✅ `carousel_items` (SELECT only)
- ✅ Content tables: `vlogs`, `recipes`, `storefront_products`, `spotify_playlists`, `photo_albums` (SELECT only)

Make sure your Supabase RLS policies allow anonymous/public reads on these tables for published content.

---

## Questions?

If you're unsure about a carousel structure or how to query specific content:
1. Check the admin dashboard at the carousel you want to replicate
2. Look at the `kind` field to understand what content type is being referenced
3. Refer to this guide's field mapping section
4. Check `types/kind_field.md` in the admin repo for the authoritative kind → field mapping

---

**Last Updated:** January 2025
**Admin Dashboard Repo:** alexis-griswold-admin
**This Guide Is For:** Public Vite website developers
