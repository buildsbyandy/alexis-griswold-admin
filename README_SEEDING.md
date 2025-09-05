# Database Seeding Guide

This guide explains how to populate your Supabase database with sample data for the Alexis Griswold admin dashboard.

## What Gets Seeded

The seeding process adds realistic sample data to give admins a starting point:

### 🏠 Home Page Content
- Hero section with welcome message
- Background video/image paths
- Copyright information

### 🎥 Vlogs Section
- **Hero Content**: Title, subtitle, body text, featured video
- **Video Carousels**: 
  - Main Channel Carousel (3 sample YouTube videos)
  - AG Vlogs Carousel (3 sample personal videos)
- **Photo Albums**: 6 sample albums with descriptions
- **Spotify Playlists**: 3 sample playlists with colors and branding

### 🍳 Recipes Section
- **Sample Recipes**: 6 complete recipes including:
  - Green Goddess Smoothie (beginner-friendly, favorite)
  - Chocolate PB Power Bowl (recipe of the week)
  - Rainbow Buddha Bowl (medium difficulty)
  - Raw Zucchini Noodles with Pesto
  - Raw Chocolate Avocado Brownies
  - Creamy Tahini Dressing
- **Complete Recipe Data**: Ingredients, instructions, prep time, tags, difficulty levels

### 💚 Healing Section
- **Hero Content**: Title, subtitle, description, featured video
- **Video Carousels**:
  - Part 1: Candida Cleanse (4 educational videos)
  - Part 2: Rebuild & Repair (4 gut health videos)
- **Products & Supplements**: 6 healing products with descriptions and usage instructions

### 🛍️ Storefront Section
- **12 Sample Products** across all categories:
  - **Kitchen**: Vitamix Blender, Bamboo Cutting Boards, Glass Storage
  - **Wellness**: Salt Lamp, Oil Diffuser
  - **Beauty**: Jade Roller, Rosehip Oil
  - **Fitness**: Cork Yoga Mat, Resistance Bands
  - **Lifestyle**: Meditation Cushion, Gratitude Journal, Cotton Tote
- **Complete Product Data**: Descriptions, prices, categories, tags, affiliate links
- **Realistic Content**: "Alexis' Pick" flags, favorites, detailed descriptions

## Seeding Methods

### Method 1: Using the Seeding Script (Recommended)

1. **Install Dependencies** (if not already done):
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Run the Seeding Script**:
   ```bash
   node scripts/seed-database.js
   ```

3. **Verify Results**:
   - Check your Supabase dashboard
   - Log into the admin dashboard to see sample content

### Method 2: Using SQL Migrations

If you prefer to run SQL directly:

1. **Connect to your Supabase database**
2. **Run the migration files in order**:
   - `supabase/migrations/001_seed_sample_data.sql` (Home, Vlogs, Albums, Playlists)
   - `supabase/migrations/002_seed_recipes_data.sql` (Recipes, Ingredients, Instructions)
   - `supabase/migrations/003_seed_healing_data.sql` (Healing videos and products)
   - `supabase/migrations/004_seed_storefront_data.sql` (Storefront products)

## Prerequisites

Before seeding, ensure you have:

- ✅ **Supabase Project**: Created and running
- ✅ **Database Tables**: All required tables created (see `types/database.ts`)
- ✅ **Environment Variables**: Properly configured in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
- ✅ **Permissions**: Service role key has write access to all tables

## What You'll See After Seeding

Once seeded, your admin dashboard will show:

- **Vlogs Page**: 6 sample videos, 6 photo albums, 3 Spotify playlists
- **Recipes Page**: 6 complete recipes with ingredients and instructions
- **Healing Page**: 8 educational videos, 6 supplement products
- **Storefront Page**: 12 products across all categories
- **Home Page**: Complete hero section content

## Customizing the Sample Data

### Updating YouTube Video IDs
The sample data includes placeholder YouTube video IDs. To use real videos:

1. **Edit the migration files** or seeding script
2. **Replace video IDs** with actual YouTube video IDs from your channel
3. **Update thumbnails** (they're auto-generated from YouTube IDs)

### Updating Product Information
To customize storefront products:

1. **Edit** `004_seed_storefront_data.sql` or the seeding script
2. **Update prices, descriptions, and affiliate links**
3. **Add your own product images** to the public folder

### Adding More Content
To add additional sample content:

1. **Follow the existing patterns** in the migration files
2. **Use realistic data** that matches your brand
3. **Maintain proper foreign key relationships**

## Troubleshooting

### Connection Issues
```
❌ Database connection failed
```
**Solutions**:
- Check your Supabase project status
- Verify environment variables
- Ensure service role key has correct permissions

### Table Not Found Errors
```
❌ relation "recipes" does not exist
```
**Solutions**:
- Run database migrations to create tables first
- Check your database schema matches `types/database.ts`

### Permission Errors
```
❌ new row violates row-level security policy
```
**Solutions**:
- Use the service role key (not anon key)
- Check RLS policies allow insertion
- Temporarily disable RLS for seeding if necessary

### Duplicate Key Errors
```
❌ duplicate key value violates unique constraint
```
**Solutions**:
- The seeding script uses `UPSERT` to handle duplicates
- Clear existing data if you want a fresh start
- Check for conflicting IDs or slugs

## Data Management

### Clearing Sample Data
To remove all sample data:

```sql
-- Clear in reverse dependency order
DELETE FROM recipe_tags;
DELETE FROM recipe_instructions;  
DELETE FROM recipe_ingredients;
DELETE FROM recipes;
DELETE FROM storefront_product_tags;
DELETE FROM storefront_products;
DELETE FROM healing_products;
DELETE FROM healing_carousel_videos;
DELETE FROM healing_video_carousels;
DELETE FROM healing_page_content;
DELETE FROM carousel_videos;
DELETE FROM video_carousels;
DELETE FROM spotify_playlists;
DELETE FROM photo_albums;
DELETE FROM vlogs_page_content;
DELETE FROM home_content;
```

### Re-seeding
To re-seed with fresh data:

1. **Clear existing data** (optional)
2. **Run the seeding script** again
3. **Verify the results**

## Next Steps

After seeding:

1. **Review the Sample Content**: Log into your admin dashboard
2. **Customize as Needed**: Edit the sample data to match your brand
3. **Add Real Media**: Upload actual images and videos
4. **Test Functionality**: Ensure all CRUD operations work correctly
5. **Set Up Production**: Configure for your production environment

The sample data provides a realistic foundation that demonstrates best practices for content structure and organization. Use it as a template for understanding how your admin dashboard should be populated with real content.