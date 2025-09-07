#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script seeds the Supabase database with sample data for the Alexis Griswold
 * admin dashboard. It provides realistic examples to help admins understand how
 * content should be structured and filled out.
 * 
 * Usage:
 *   node scripts/seed-database.js
 *   
 * Prerequisites:
 *   - Supabase project set up
 *   - Database tables created
 *   - Environment variables configured (.env.local)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SECRET_KEY');
  console.error('');
  console.error('Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Execute SQL file
 */
async function executeSqlFile(filePath) {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📄 Executing ${path.basename(filePath)}...`);
  
  try {
    // For complex migrations, we might need to split on GO statements or similar
    // For now, we'll execute as one block
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
      return false;
    }
    
    console.log(`✅ Successfully executed ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception executing ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

/**
 * Alternative approach: Use Supabase client directly for data insertion
 */
async function seedDataDirectly() {
  console.log('🌱 Seeding database with sample data using Supabase client...');
  
  try {
    // Seed Home Content
    console.log('📝 Seeding home page content...');
    const { error: homeError } = await supabase
      .from('home_content')
      .upsert({
        background_video_path: '/alexisHome.mp4',
        background_image_path: '/public/images/home-fallback.jpg',
        hero_main_title: 'Welcome to Alexis Griswold',
        hero_subtitle: 'Experience wellness, recipes, and lifestyle content',
        copyright_text: '© 2025 Alexis Griswold',
        is_published: true
      });
    
    if (homeError) throw homeError;
    
    // Seed Vlogs Content
    console.log('🎥 Seeding vlogs content...');
    const { data: vlogsData, error: vlogsError } = await supabase
      .from('vlogs_page_content')
      .upsert({
        hero_main_title: 'VLOGS',
        hero_main_subtitle: 'Step into my life — one video at a time.',
        hero_body_paragraph: 'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary.',
        hero_youtube_url: 'https://www.youtube.com/watch?v=MYmmbSZ4YaQ',
        hero_video_title: 'Morning Routine & Healthy Breakfast',
        hero_video_subtitle: 'Current',
        hero_video_date: '2024-01-15',
        youtube_channel_url: 'https://www.youtube.com/@alexisgriswold',
        tiktok_profile_url: 'https://www.tiktok.com/@alexisgriswold',
        is_published: true
      })
      .select();
    
    if (vlogsError) throw vlogsError;
    
    // Seed Healing Content
    console.log('💚 Seeding healing content...');
    const { error: healingError } = await supabase
      .from('healing_page_content')
      .upsert({
        hero_main_title: 'HEALING',
        hero_main_subtitle: 'Your journey to wellness starts here.',
        hero_body_paragraph: 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body\'s innate healing wisdom.',
        hero_video_youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        hero_video_title: 'Healing Journey Introduction',
        hero_video_subtitle: 'Current',
        hero_video_date: '2024-01-15',
        is_published: true
      });
    
    if (healingError) throw healingError;
    
    // Seed Sample Recipes
    console.log('🍳 Seeding recipes...');
    const sampleRecipes = [
      {
        recipe_title: 'Green Goddess Smoothie',
        recipe_slug: 'green-goddess-smoothie',
        recipe_description: 'A nutrient-packed smoothie with spinach, banana, and tropical flavors that tastes like paradise.',
        prep_time_minutes: 5,
        cook_time_minutes: 0,
        servings_count: 2,
        difficulty_level: 'Easy',
        is_beginner_friendly: true,
        is_recipe_of_week: false,
        is_published: true,
        is_favorite: true,
        recipe_image_path: '/recipes/green-smoothie.jpg',
        folder_name: 'smoothies'
      },
      {
        recipe_title: 'Chocolate Peanut Butter Power Bowl',
        recipe_slug: 'chocolate-pb-power-bowl',
        recipe_description: 'Rich, creamy, and satisfying smoothie bowl topped with fresh fruits and granola.',
        prep_time_minutes: 10,
        cook_time_minutes: 0,
        servings_count: 1,
        difficulty_level: 'Easy',
        is_beginner_friendly: true,
        is_recipe_of_week: true,
        is_published: true,
        is_favorite: false,
        recipe_image_path: '/recipes/chocolate-pb-bowl.jpg',
        folder_name: 'smoothies'
      }
    ];
    
    const { error: recipesError } = await supabase
      .from('recipes')
      .upsert(sampleRecipes);
    
    if (recipesError) throw recipesError;
    
    // Seed Sample Storefront Products
    console.log('🛍️ Seeding storefront products...');
    const sampleProducts = [
      {
        product_title: 'Vitamix Professional Blender',
        product_slug: 'vitamix-professional-blender',
        product_description: 'High-performance blender perfect for smoothies, soups, and nut butters.',
        detailed_description: 'The Vitamix Professional Series 750 is a game-changer in the kitchen. With its powerful motor and precision blades, it creates the smoothest smoothies, creamiest soups, and can even make hot soup through friction heating.',
        price_cents: 54900,
        category: 'Kitchen',
        status: 'Published',
        is_alexis_pick: true,
        is_favorite: true,
        product_image_path: '/products/vitamix-blender.jpg',
        affiliate_link: 'https://amazon.com/vitamix-professional-blender',
        sort_weight: 1
      },
      {
        product_title: 'Essential Oil Diffuser',
        product_slug: 'essential-oil-diffuser',
        product_description: 'Ultrasonic diffuser with color-changing LED lights for aromatherapy.',
        detailed_description: 'This sleek ultrasonic diffuser disperses essential oils evenly throughout your space while the color-changing LED lights create a spa-like atmosphere.',
        price_cents: 3500,
        category: 'Wellness',
        status: 'Published',
        is_alexis_pick: true,
        is_favorite: true,
        product_image_path: '/products/oil-diffuser.jpg',
        affiliate_link: 'https://amazon.com/essential-oil-diffuser',
        sort_weight: 2
      }
    ];
    
    const { error: productsError } = await supabase
      .from('storefront_products')
      .upsert(sampleProducts);
    
    if (productsError) throw productsError;
    
    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary of seeded data:');
    console.log('   - Home page content');
    console.log('   - Vlogs page content');  
    console.log('   - Healing page content');
    console.log('   - 2 sample recipes');
    console.log('   - 2 sample storefront products');
    console.log('');
    console.log('🎉 Your admin dashboard now has sample data to work with!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

/**
 * Check database connection
 */
async function checkConnection() {
  console.log('🔗 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('home_content')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🌱 Alexis Griswold Admin Dashboard - Database Seeding');
  console.log('==================================================');
  console.log('');
  
  // Check connection first
  const connected = await checkConnection();
  if (!connected) {
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Ensure your Supabase project is running');
    console.error('   2. Check your environment variables');
    console.error('   3. Verify your database tables exist');
    process.exit(1);
  }
  
  console.log('');
  
  // Ask for confirmation
  console.log('⚠️  This will add sample data to your database.');
  console.log('   Existing data will not be deleted, but some may be updated.');
  console.log('');
  
  // For now, proceed automatically. In production, you might want user confirmation
  console.log('🚀 Proceeding with database seeding...');
  console.log('');
  
  // Execute seeding
  await seedDataDirectly();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { seedDataDirectly, checkConnection };