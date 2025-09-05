# Admin Dashboard Functionality Analysis

Based on the analysis of the current admin dashboard implementation and the old live dashboard screenshots, here's a comprehensive breakdown of what needs to be editable on each page:

## 🎥 VLOGS PAGE

### Editable Elements:

#### 1. Hero Section
- **Hero Title**: "VLOGS" (currently editable)
- **Hero Subtitle**: "Step into my life — one video at a time." (currently editable)
- **Hero Body Text**: Long description text (currently editable)
- **Featured Video**: 
  - Video title, description, duration, published date
  - YouTube URL/embed code
  - Thumbnail image

#### 2. Video Carousels (Multiple carousels)
- **Main Channel Carousel**:
  - Carousel title and description
  - Individual video cards with:
    - Video title, thumbnail, duration, view count
    - YouTube URL
    - Edit/Delete functionality
- **AG Vlogs Carousel** (Personal content):
  - Same structure as main carousel
  - Personal video content

#### 3. Photo Gallery Management
- **Albums**: Title, description, cover image
- **Individual Photos**: Upload, categorization, captions
- **Social Media Integration**:
  - Instagram button text
  - TikTok button text

#### 4. Spotify Playlists Section
- **Section Content**:
  - Section title: "Listen to My Playlists"  
  - Section subtitle: "Curated music for every mood and moment"
- **Individual Playlists**:
  - Playlist name, mood, color theme
  - Spotify URL/embed
  - Edit/Delete functionality

## 🍳 RECIPES PAGE

### Editable Elements:

#### 1. Recipe Management
- **Individual Recipes**:
  - Title, description
  - Ingredients list (add/remove ingredients)
  - Instructions (step-by-step, add/remove steps)
  - Prep time, cook time, servings
  - Difficulty level dropdown
  - Folder/category assignment
  - Tags system
  - Featured image
  - Special flags:
    - "Beginner Recipe" checkbox
    - "Recipe of the Week" checkbox

#### 2. Organization Features
- **Folders/Categories**: Custom folder creation and management
- **Search Functionality**: Filter by title, ingredients, tags
- **Statistics Dashboard**:
  - Total recipes count
  - Beginner recipes count
  - Recipe of the week count
  - Active folders count

#### 3. Import/Export
- **Data Management**:
  - Export recipes functionality
  - Import recipes functionality
  - Sample data restoration

## 💚 HEALING PAGE

### Editable Elements:

#### 1. Hero Section
- **Hero Content**:
  - Title: "HEALING"
  - Subtitle: "Your journey to wellness starts here."
  - Body text: Long descriptive text about healing approach
- **Featured Video**:
  - Current video title, description, duration
  - Published date
  - YouTube URL
  - Change featured video functionality

#### 2. Video Carousels (Structured Learning Path)
- **Gut Healing Part 1: Candida Cleanse**:
  - Carousel header/description
  - Individual video cards:
    - Video titles, thumbnails, durations, view counts
    - YouTube URLs
    - Edit/Delete per video
- **Gut Healing Part 2: Rebuild & Repair**:
  - Same structure as Part 1
  - Focus on rebuilding content

#### 3. Products & Supplements Section
- **Section Content**:
  - Section title: "Healing Products & Supplements"
  - Section subtitle: "Essential products to support your healing journey"
- **Individual Products**:
  - Product name (e.g., "Garden of Life Probiotics", "Vital Proteins Collagen")
  - Product image/placeholder
  - Purpose description
  - How to use instructions
  - Edit/Delete functionality

## 🛍️ STOREFRONT PAGE

### Editable Elements:

#### 1. Product Catalog Management
- **Individual Products**:
  - Product title
  - Product description
  - Price ($xx.xx format)
  - Product image
  - Category assignment (Kitchen, Wellness, Beauty, Fitness, Lifestyle)
  - Status (Published, Draft, Archived)
  - Special flags:
    - "Alexis' Pick" checkbox
    - "Favorite" checkbox (displays star icon)

#### 2. Organization & Filtering
- **Categories**: Kitchen, Wellness, Beauty, Fitness, Lifestyle
- **Status Management**: Published, Draft, Archived
- **Search Functionality**: Filter by product title
- **Statistics**:
  - Total products count
  - Count by status (draft, published, archived)
  - Count by category
  - Favorites count

#### 3. Product Details
- **Comprehensive Product Info**:
  - Full product description
  - Multiple product images
  - Pricing information
  - Availability status
  - Product specifications
  - Related product suggestions

## 🏠 HOME PAGE (Additional)

### Editable Elements:

#### 1. Hero Section
- **Video Background**: Main video file path
- **Fallback Image**: Image for when video doesn't load
- **Hero Text**:
  - Main title: "Welcome to Alexis Griswold"
  - Description: "Experience wellness, recipes, and lifestyle content"

## 📊 ANALYTICS & STATISTICS

### Cross-Page Metrics:
- **Vlogs**: Total videos, photo albums, Spotify playlists, featured video
- **Recipes**: Total recipes, beginner recipes, recipe of week, active folders  
- **Healing**: Part 1 videos, Part 2 videos, products, featured video
- **Storefront**: Total products, by status, by category, favorites

## 🔧 TECHNICAL REQUIREMENTS

### Database Schema Needs:
1. **Vlogs**: videos, albums, playlists, hero_content
2. **Recipes**: recipes, ingredients, instructions, folders, tags
3. **Healing**: videos, products, hero_content, carousel_headers
4. **Storefront**: products, categories, product_images
5. **Home**: hero_content, background_media

### File Upload Requirements:
- Image uploads for all product/video thumbnails
- Video file uploads for hero backgrounds
- Support for various image formats (PNG, JPG, WebP)

### Content Management Features:
- Rich text editing for descriptions
- Drag-and-drop reordering
- Bulk operations (delete, status change)
- Search and filtering across all content types
- Import/export functionality for data migration

This analysis provides a complete roadmap for implementing the admin dashboard functionality that matches the original website's content management needs.