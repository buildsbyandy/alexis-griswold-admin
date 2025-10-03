# Public Site Page Implementation Guide (v2)

This guide maps each page of the public Vite website to the exact Supabase carousels and data structures needed. Based on actual carousel slugs and confirmed layouts.

---

## 🎬 VLOGS PAGE

### Page Structure
1. **Hero Section** - Featured video (top right)
2. **Main Channel Carousel** - Video carousel with CTA button
3. **AG Vlogs Carousel** - Video carousel with CTA button
4. **Instagram/TikTok CTA Buttons** - Hardcoded social links
5. **Photo Albums Grid** - 6 album thumbnails (static grid, not carousel)
6. **Spotify Playlists Section** - Playlist carousel

---

### 1. Hero Section - Featured Video

**Carousel:** `vlogs-featured`
**Kind:** `video`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'vlogs')
  .eq('slug', 'vlogs-featured')
  .single();

// Get the featured item (marked with is_featured = true)
const { data: featuredItem } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_featured', true)
  .eq('is_active', true)
  .single();

// Fetch the vlog data
const { data: vlog } = await supabase
  .from('vlogs')
  .select('*')
  .eq('youtube_id', featuredItem.youtube_id)
  .single();
```

**Display Mapping:**
- Large video thumbnail → `vlog.thumbnail_url` or `featuredItem.image_path`
- Video title → `featuredItem.caption` or `vlog.title`
- Subtitle → `vlog.description`
- Watch Now button → Links to `vlog.youtube_url`
- Date badge → `vlog.published_at`
- Duration overlay → `vlog.duration`

---

### 2. Main Channel Carousel

**Carousel:** `vlogs-main-channel`
**Kind:** `video`
**CTA Button:** "More of my life in motion" (hardcoded, links to YouTube channel)

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'vlogs')
  .eq('slug', 'vlogs-main-channel')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Get all vlog data
const youtubeIds = items.map(i => i.youtube_id).filter(Boolean);
const { data: vlogs } = await supabase
  .from('vlogs')
  .select('*')
  .in('youtube_id', youtubeIds);
```

**Display Mapping:**
- Section title → `carousel.title` ("Main Channel")
- UI shows 3 cards at a time with arrow navigation (fetch all, let UI paginate)
- Each card:
  - Thumbnail → `vlog.thumbnail_url` or `item.image_path`
  - Title → `item.caption` or `vlog.title`
  - Description → `vlog.description`
  - Date → `vlog.published_at`
  - Duration → `vlog.duration`
  - Badge (optional) → `item.badge`

---

### 3. AG Vlogs Carousel

**Carousel:** `vlogs-ag-vlogs`
**Kind:** `video`
**CTA Button:** "Life behind the posts" (hardcoded, links to AG Vlogs channel)

**Same query pattern as Main Channel**, just use `slug: 'vlogs-ag-vlogs'`

---

### 4. Instagram/TikTok CTA Buttons

**Hardcoded buttons:**
- "Follow me on Instagram 📷"
- "Follow me on TikTok 🎵"

These link to social profiles - no database queries needed.

---

### 5. Photo Albums Grid

**Carousel:** `vlogs-photo-gallery`
**Kind:** `album`
**Layout:** Static 6-photo grid (not a sliding carousel)

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'vlogs')
  .eq('slug', 'vlogs-photo-gallery')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Fetch album metadata
const albumIds = items.map(i => i.album_id).filter(Boolean);
const { data: albums } = await supabase
  .from('photo_albums')
  .select(`
    *,
    album_photos(*)
  `)
  .in('id', albumIds);
```

**Display Mapping:**
- Section header → `carousel.title` (optional, can be added in future)
- Section subtitle → `carousel.description` (optional)
- Grid layout: 6 thumbnails displayed in 2 rows of 3
- Each thumbnail:
  - Image → `album.cover_image_path` or first photo from `album_photos`
  - Click → Opens photo gallery modal with all photos from that album

---

### 6. Spotify Playlists Section

**Carousel:** `vlogs-spotify-playlists`
**Kind:** `playlist`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'vlogs')
  .eq('slug', 'vlogs-spotify-playlists')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Get playlist metadata
const playlistIds = items.map(i => i.ref_id).filter(Boolean);
const { data: playlists } = await supabase
  .from('spotify_playlists')
  .select('*')
  .in('id', playlistIds);
```

**Display Mapping:**
- Section title → "Listen to My Playlists"
- Section subtitle → "Curated music for every mood and moment"
- Green button → "Listen my vibe on Spotify 🎵" (links to Spotify profile)
- Carousel shows 3 cards at a time with arrows
- Each playlist card:
  - Background color → `playlist.card_color`
  - Color overlay → If `playlist.use_color_overlay` is true, apply color overlay on image
  - Thumbnail → `playlist.thumbnail_path` or `item.image_path`
  - Title → `playlist.playlist_title`
  - Description → `playlist.description`
  - Spotify icon → Static
  - "Tap to listen" button → Links to `playlist.spotify_url`

---

## 🍳 RECIPES PAGE

### Page Structure
1. **Hero Section** - Featured TikTok videos carousel
2. **Recipe of the Week CTA** - Modal trigger button
3. **Just Starting Out Carousel** - Beginner recipes
4. **Recipe Folders Section** - Expandable category list

---

### 1. Hero Section - Featured TikTok Videos Carousel

**Carousel:** `recipes-hero-videos`
**Kind:** `tiktok` or `external`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'recipes')
  .eq('slug', 'recipes-hero-videos')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// No additional fetching needed - all data is in carousel_items
```

**Display Mapping:**
- Carousel shows 3 cards at a time (mobile-style video format)
- User can click arrows or swipe to see more videos
- Each card:
  - Video thumbnail → `item.image_path` (required for tiktok/external items)
  - Badge (e.g., "YouTube Reel", "TikTok") → `item.badge`
  - Title overlay → `item.caption` (required)
  - Video link → `item.link_url` (the actual TikTok or external video URL)

---

### 2. Recipe of the Week CTA

**Carousel:** `recipes-weekly-pick`
**Kind:** `recipe`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'recipes')
  .eq('slug', 'recipes-weekly-pick')
  .single();

// Get the weekly pick (should only be 1 item, or use is_featured flag)
const { data: item } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true })
  .limit(1)
  .single();

// Fetch the recipe
const { data: recipe } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', item.ref_id)
  .single();
```

**Display Mapping:**
- CTA button: "Recipe of the Week!"
- Click opens recipe modal with full recipe details
- Modal shows:
  - Recipe title → `recipe.recipe_title`
  - Image → `recipe.card_image_path`
  - Description → `recipe.description`
  - Ingredients → `recipe.ingredients`
  - Instructions → `recipe.instructions`
  - Prep time → `recipe.prep_time`
  - Cook time → `recipe.cook_time`

**Placement:** Between hero videos and "Just Starting Out" section

---

### 3. Just Starting Out Carousel

**Carousel:** `recipes-beginner`
**Kind:** `recipe`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'recipes')
  .eq('slug', 'recipes-beginner')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Fetch recipe metadata
const recipeIds = items.map(i => i.ref_id).filter(Boolean);
const { data: recipes } = await supabase
  .from('recipes')
  .select('*')
  .in('id', recipeIds);
```

**Display Mapping:**
- Section title → `carousel.title` ("Just Starting Out")
- Section subtitle → `carousel.description` ("Simple recipes for beginners")
- Shows 3 cards at a time with arrow navigation
- Each recipe card:
  - Image → `recipe.card_image_path` or `item.image_path`
  - Category badge → `recipe.category_tag` (e.g., "Juice", "Meals", "Smoothie")
  - Difficulty badge → "Beginner" (green badge, hardcoded)
  - Title → `recipe.recipe_title`
  - Description → `recipe.description`

---

### 4. Recipe Folders (Categories)

**Table:** `recipe_folders`

**Query Pattern:**
```javascript
const { data: folders } = await supabase
  .from('recipe_folders')
  .select(`
    id,
    folder_name,
    folder_emoji,
    folder_slug,
    recipes(count)
  `)
  .eq('is_active', true)
  .order('order_index', { ascending: true });
```

**Display Mapping:**
- Search bar → Client-side filtering
- Each folder row:
  - Icon → `folder.folder_emoji`
  - Title → `folder.folder_name`
  - Count → Recipe count from join
  - Expand arrow → Click to load recipes in that folder

When expanded, fetch recipes:
```javascript
const { data: recipes } = await supabase
  .from('recipes')
  .select('*')
  .eq('folder_id', folderId)
  .eq('status', 'published')
  .order('created_at', { ascending: false });
```

---

## 🌿 HEALING PAGE

### Page Structure (UPDATED LAYOUT)
1. **Hero Section** - Featured healing video
2. **Photo Album Carousel 1** - "Gut Healing Part 1"
3. **Photo Album Carousel 2** - "Gut Healing Part 2"
4. **TikTok Videos Carousel** - "TikTok Inspirations"
5. **Healing Products Grid** - Product recommendations

---

### 1. Hero Section - Featured Healing Video

**Carousel:** `healing-featured`
**Kind:** `video`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'healing')
  .eq('slug', 'healing-featured')
  .single();

const { data: featuredItem } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_featured', true)
  .eq('is_active', true)
  .single();

// Fetch the vlog data
const { data: vlog } = await supabase
  .from('vlogs')
  .select('*')
  .eq('youtube_id', featuredItem.youtube_id)
  .single();
```

**Display Mapping:** Same as Vlogs featured section

---

### 2. Photo Album Carousel - "Gut Healing Part 1"

**Carousel:** `healing-part-1`
**Kind:** `album` (CHANGED from video)

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'healing')
  .eq('slug', 'healing-part-1')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Fetch album metadata
const albumIds = items.map(i => i.album_id).filter(Boolean);
const { data: albums } = await supabase
  .from('photo_albums')
  .select(`
    *,
    album_photos(*)
  `)
  .in('id', albumIds);
```

**Display Mapping:**
- Section title → `carousel.title` ("Gut Healing Part 1: Test 1")
- Section subtitle → `carousel.description` ("Gut Healing Test Description 1")
- Shows 3 cards at a time with arrow navigation
- Each album card (styled like a video card):
  - Cover image → `album.cover_image_path` or first photo from `album_photos`
  - "4K" badge → Static or based on photo quality
  - Title → `album.album_title` or `item.caption`
  - Description → `album.album_description`
  - Date → `item.created_at` or album date
  - Click → Opens photo gallery modal

---

### 3. Photo Album Carousel - "Gut Healing Part 2"

**Carousel:** `healing-part-2`
**Kind:** `album` (CHANGED from video)

**Same query pattern as Part 1**, just use `slug: 'healing-part-2'`

**Display Mapping:**
- Section title → "Gut Healing Part 2: Rebuild & Repair"
- Section subtitle → "Videos focused on rebuilding gut health after cleansing"

---

### 4. TikTok Videos Carousel - "TikTok Inspirations"

**Carousel:** `healing-tiktoks`
**Kind:** `tiktok` or `external`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'healing')
  .eq('slug', 'healing-tiktoks')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// No additional fetching needed - all data is in carousel_items
```

**Display Mapping:**
- Section title → `carousel.title` ("TikTok Inspirations")
- Section subtitle → `carousel.description` ("Inspirational TikTok videos for motivation and healing")
- Shows 3 cards at a time with arrow navigation
- Each card (same style as album cards above):
  - Thumbnail → `item.image_path` (required)
  - Badge → `item.badge` (e.g., "TikTok", "YouTube Short")
  - Title → `item.caption` (required)
  - Video link → `item.link_url` (the actual video URL)

---

### 5. Healing Products & Supplements

**Carousel:** `healing-products`
**Kind:** `product`

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id, title, description')
  .eq('page', 'healing')
  .eq('slug', 'healing-products')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Fetch healing product metadata
const productIds = items.map(i => i.ref_id).filter(Boolean);
const { data: products } = await supabase
  .from('healing_products')
  .select('*')
  .in('id', productIds);
```

**Display Mapping:**
- Section title → `carousel.title` ("Healing Products & Supplements")
- Section subtitle → `carousel.description` ("Essential products to support your healing journey")
- Grid layout (not carousel) - display all products
- Each product card:
  - Image → `product.product_image_path` or `item.image_path`
  - Title → `product.product_title`
  - Purpose label → "PURPOSE"
  - Purpose text → `product.product_purpose`
  - Usage label → "HOW TO USE"
  - Usage text → `product.how_to_use`
  - "View on Amazon" button → Links to `product.amazon_url`

---

## 🛍️ STOREFRONT PAGE

### Page Structure
1. **My Favorites Carousel** - Featured products
2. **Shop by Category Section** - 4 category cards
3. **Search Bar** - Search all products

---

### 1. My Favorites Carousel

**Carousel:** `storefront-favorites`
**Kind:** `product`

**Uses the carousel service helper:**
```javascript
import { listStorefrontItems } from '@/lib/services/carouselService';

const result = await listStorefrontItems('storefront-favorites');
const favoriteProducts = result.data || [];
```

**Or query directly:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'storefront')
  .eq('slug', 'storefront-favorites')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

const productIds = items.map(i => i.ref_id).filter(Boolean);
const { data: products } = await supabase
  .from('storefront_products')
  .select('*')
  .in('id', productIds);
```

**Display Mapping:**
- Section title → "My Favorites"
- Shows 3-4 cards at a time with arrow navigation
- Each product card:
  - Image → `product.image_path` or `item.image_path`
  - Category badge (e.g., "food", "healing", "home") → Derive from `product.category_slug`
  - Title → `product.product_title` (optional display)
  - "View on Amazon" button → Links to `product.amazon_url`

---

### 2. Shop by Category Section

**Table:** `storefront_categories` (NOT a carousel)

**Query Pattern:**
```javascript
const { data: categories } = await supabase
  .from('storefront_categories')
  .select('*')
  .eq('is_visible', true)
  .order('sort_order', { ascending: true });
```

**Display Mapping:**
- Section title → "Shop by Category"
- Section subtitle → "Explore 4 categories - X picks" (calculate product count dynamically)
- Grid of 4 category cards (Food, Healing, Home, Personal Care)
- Each category card:
  - Background image → `category.category_image_path`
  - Title → `category.category_name`
  - Description → `category.category_description`
  - Click → Navigate to `/storefront/category/${category.slug}`

**Important:** Categories are managed directly in the `storefront_categories` table, NOT through the carousel system. The admin can update images and text via the "Category Photos" button in the admin CMS.

---

### 3. Category Detail Page - Top Picks Carousel

**Carousel:** `storefront-top-picks`
**Kind:** `product`

**Used on:** Individual category pages (e.g., `/storefront/category/food`)

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'storefront')
  .eq('slug', 'storefront-top-picks')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Filter by category slug if needed
const productIds = items.map(i => i.ref_id).filter(Boolean);
const { data: products } = await supabase
  .from('storefront_products')
  .select('*')
  .in('id', productIds)
  .eq('category_slug', categorySlug); // Filter by current category
```

**Display Mapping:**
- Section title → "Top Picks" (at top of category page)
- Shows featured products for that specific category
- Same card style as "My Favorites"

---

### 4. Featured Categories Carousel

**Carousel:** `storefront-featured-categories`
**Purpose:** Controls which categories from `storefront_categories` are highlighted/featured

**Query Pattern:**
```javascript
const { data: carousel } = await supabase
  .from('carousels')
  .select('id')
  .eq('page', 'storefront')
  .eq('slug', 'storefront-featured-categories')
  .single();

const { data: items } = await supabase
  .from('carousel_items')
  .select('*')
  .eq('carousel_id', carousel.id)
  .eq('is_active', true)
  .order('order_index', { ascending: true });

// Items use ref_id to point to storefront_categories
const categoryIds = items.map(i => i.ref_id).filter(Boolean);
const { data: categories } = await supabase
  .from('storefront_categories')
  .select('*')
  .in('id', categoryIds);
```

**Usage:** This carousel determines the order and which categories are "featured" within the carousel system. The "Shop by Category" section displays all categories, but this carousel could be used for a separate "Featured Categories" section or to control order.

---

### 5. Search All Products

**Query Pattern:**
```javascript
const { data: products } = await supabase
  .from('storefront_products')
  .select('*')
  .eq('status', 'published')
  .ilike('product_title', `%${searchTerm}%`)
  .order('product_title', { ascending: true });
```

**Orange CTA button:** "Shop my Amazon Storefront" → Links to Amazon storefront URL (hardcoded)

---

## 🎨 UNIVERSAL PATTERNS

### Carousel Display Rules

1. **Visible Items:** Show 3 cards at a time with arrow navigation
2. **Data Fetching:** Fetch ALL items in carousel, let UI handle pagination/scrolling
3. **Auto-scroll:** Let public site's existing carousel component handle automatic rotation
4. **Mobile:** Swipe gestures for navigation

### Image Overrides
Always check for carousel item overrides:
```javascript
const displayImage = item.image_path || content.thumbnail_url || content.card_image_path || content.cover_image_path;
```

### Caption Overrides
Always check for carousel item overrides:
```javascript
const displayTitle = item.caption || content.title || content.recipe_title || content.album_title;
```

### Badge Display
- Source: `item.badge` field in carousel_items
- Examples: "NEW", "FEATURED", "TikTok", "YouTube Reel"
- Conditional display: Only show if badge exists

### Featured Items
- Use `is_featured` flag for hero/prominent sections
- Only one item should have `is_featured: true` per carousel (for hero sections)
- Featured items are displayed larger/differently

---

## 📋 COMPLETE CAROUSEL REFERENCE

### Vlogs Page Carousels
- `vlogs-featured` → Hero featured video (kind: video, uses is_featured)
- `vlogs-main-channel` → Main channel carousel (kind: video)
- `vlogs-ag-vlogs` → AG vlogs carousel (kind: video)
- `vlogs-photo-gallery` → Photo albums grid (kind: album, 6-item static grid)
- `vlogs-spotify-playlists` → Spotify section (kind: playlist)

### Recipes Page Carousels
- `recipes-hero-videos` → Hero TikTok videos carousel (kind: tiktok/external)
- `recipes-weekly-pick` → Recipe of the week CTA (kind: recipe, single item)
- `recipes-beginner` → Just starting out section (kind: recipe)

### Healing Page Carousels
- `healing-featured` → Hero featured video (kind: video, uses is_featured)
- `healing-part-1` → Gut Healing Part 1 photo albums (kind: album)
- `healing-part-2` → Gut Healing Part 2 photo albums (kind: album)
- `healing-tiktoks` → TikTok inspirations carousel (kind: tiktok/external)
- `healing-products` → Products grid (kind: product, uses healing_products table)

### Storefront Page Carousels
- `storefront-favorites` → My favorites carousel (kind: product)
- `storefront-top-picks` → Top picks for category pages (kind: product)
- `storefront-featured-categories` → Featured categories order (kind: product, refs storefront_categories)

### Storefront Special Table
- `storefront_categories` → Shop by Category section (NOT a carousel, direct table query)

---

## 🚀 IMPLEMENTATION CHECKLIST

For each page, follow this pattern:

1. ✅ Identify all carousels needed (see reference above)
2. ✅ Query carousels table to get carousel IDs
3. ✅ Query carousel_items to get items for each carousel
4. ✅ **Fetch ALL items** (no limit) - let UI component handle 3-at-a-time display
5. ✅ Batch fetch referenced content based on `kind` field
6. ✅ Create lookup maps to join carousel items with content
7. ✅ Apply overrides (image_path, caption, badge)
8. ✅ Sort by order_index
9. ✅ Filter by is_active and is_featured flags
10. ✅ Pass complete dataset to carousel UI component
11. ✅ Let carousel component handle: 3-item display, arrows, auto-scroll, swipe

---

## 💡 KEY DIFFERENCES FROM V1

1. **Recipes hero** uses `recipes-hero-videos` (not `recipes-tiktoks`) - TikTok/external content
2. **Added** `recipes-weekly-pick` - Modal CTA for featured recipe
3. **Vlogs photo gallery** - Static 6-item grid (kind: album), not a scrolling carousel
4. **Healing carousels** - Part 1 and Part 2 are now `kind: album` (changed from video)
5. **Storefront categories** - Managed via `storefront_categories` table, NOT carousel system
6. **Top picks carousel** - Used on category detail pages, not main storefront page
7. **Carousel display** - Fetch all items, show 3 at a time, let UI handle pagination

---

**Last Updated:** January 2025 (v2)
**References:**
- `CAROUSEL_SYSTEM_GUIDE_FOR_PUBLIC_SITE.md` - General carousel usage
- `types/kind_field.md` - Kind field mappings
- This guide - Specific page implementations with confirmed layouts
