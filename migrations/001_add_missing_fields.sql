-- Migration 001: Add missing fields to align admin dashboard with database schema
-- Execute these in order

-- 1. Create/update enum types
DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN
        -- Type already exists, alter it to ensure it has the correct values
        ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'draft';
        ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'published';  
        ALTER TYPE content_status ADD VALUE IF NOT EXISTS 'archived';
END $$;

DO $$ BEGIN
    CREATE TYPE recipe_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN
        -- Type already exists, alter it to ensure it has the correct values
        ALTER TYPE recipe_status ADD VALUE IF NOT EXISTS 'draft';
        ALTER TYPE recipe_status ADD VALUE IF NOT EXISTS 'published';
        ALTER TYPE recipe_status ADD VALUE IF NOT EXISTS 'archived';
END $$;

-- 2. Add missing fields to vlogs table
ALTER TABLE public.vlogs 
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS carousel text CHECK (carousel IN ('main-channel', 'ag-vlogs')) DEFAULT 'main-channel';

-- 3. Add missing fields to storefront_products table  
ALTER TABLE public.storefront_products
ADD COLUMN IF NOT EXISTS price decimal(10,2),
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- 4. Add missing fields to recipes table
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Update existing records to set default carousel value
UPDATE public.vlogs SET carousel = 'main-channel' WHERE carousel IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vlogs_carousel ON public.vlogs(carousel);
CREATE INDEX IF NOT EXISTS idx_storefront_products_is_favorite ON public.storefront_products(is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON public.recipes(is_favorite);

-- Ensure status columns are using the correct enum types
-- Note: This assumes your existing status columns are compatible
-- If you get errors, you may need to update existing data first