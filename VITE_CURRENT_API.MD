Current API Calls in Vite Public Site

  Direct Supabase Queries (Home.tsx)

  Home Content Query

  // File: src/pages/Home.tsx (lines 24-28)
  const { data: homeContent, error: homeError } = await supabase
    .from('home_content')
    .select('*')
    .eq('is_published', true)
    .single();

  Navigation Buttons Query

  // File: src/pages/Home.tsx (lines 37-42)
  const { data: navData, error: navError } = await supabase
    .from('navigation_buttons')
    .select('*')
    .eq('home_content_id', homeContent.id)
    .eq('is_active', true)
    .order('sort_order');

  Supabase Service Layer API Calls

  Home Content Service

  File: src/lib/database/supabaseService.ts

  // Get Home Content (lines 52-56)
  const { data: homeContent, error: homeError } = await supabase
    .from('home_content')
    .select('*')
    .eq('is_published', true)
    .single()

  // Get Navigation Buttons (lines 67-72)
  const { data: navData, error: navError } = await supabase
    .from('navigation_buttons')
    .select('*')
    .eq('home_content_id', content.id)
    .eq('is_active', true)
    .order('sort_order')

  // Update Home Content (lines 98-103)
  const { data: updatedContent, error: updateError } = await supabase
    .from('home_content')
    .update(contentData as SupabaseHomeContentUpdate)
    .eq('id', existingContent.id)
    .select()
    .single()

  // Create Home Content (lines 112-123)
  const { data: newContent, error: createError } = await supabase
    .from('home_content')
    .insert({
      hero_main_title: contentData.hero_main_title ?? '',
      hero_subtitle: contentData.hero_subtitle ?? '',
      copyright_text: contentData.copyright_text ?? '',
      background_video_path: contentData.background_video_path ?? null,
      background_image_path: contentData.background_image_path ?? null,
      is_published: contentData.is_published ?? true,
    })
    .select()
    .single()

  // Insert Navigation Buttons (lines 141-147)
  const navButtonsData: SupabaseNavigationButtonInsert[] = navigationButtons.map((btn, index) => ({
    home_content_id: homeContent.id,
    button_text: btn.button_text,
    button_href: btn.button_href,
    sort_order: index + 1,
    is_active: true,
  }))

  const { error: navError } = await supabase
    .from('navigation_buttons')
    .insert(navButtonsData)

  Recipe Service

  File: src/lib/database/supabaseService.ts

  // Get Recipes by Category (lines 169-174)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('recipe_category', category)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Get Beginner Recipes (lines 184-189)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_beginner_friendly', true)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Get Featured Recipes (lines 199-204)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Search Recipes (lines 214-219)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('status', 'published')
    .or(`recipe_name.ilike.%${query}%,recipe_description.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  // Get Recipe by Slug (lines 229-234)
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  // Create Recipe (lines 247-251)
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single()

  Vlogs Service

  File: src/lib/database/supabaseService.ts

  // Get Vlogs Page Content (lines 267-271)
  const { data, error } = await supabase
    .from('vlogs_page_content')
    .select('*')
    .eq('is_published', true)
    .single()

  // Get Carousel Videos (lines 284-288)
  const { data, error } = await supabase
    .from('carousel_videos')
    .select('*')
    .eq('carousel_id', carouselId)
    .order('sort_order')

  // Get Photo Albums (lines 298-302)
  const { data, error } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')

  // Get Album Photos (lines 312-316)
  const { data, error } = await supabase
    .from('album_photos')
    .select('*')
    .eq('album_id', albumId)
    .order('sort_order')

  Storefront Service

  File: src/lib/database/supabaseService.ts

  // Get Storefront Products (lines 332-336)
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('status', 'published')
    .order('product_title')

  // Get Products by Category (lines 369-373)
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('category_name', categoryName)
    .eq('status', 'published')
    .order('product_title')

  // Get Favorite Products (lines 402-407)
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('showInFavorites', true)
    .eq('status', 'published')
    .order('product_title')

  // Find Product by Slug (lines 436-440)
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('slug', slug)
    .single()

  // Get Categories (lines 451-454)
  const { data, error } = await supabase
    .from('storefront_categories')
    .select('*')
    .order('created_at')

  // Track Product Click (lines 476-480 & 488-495)
  const { data: product, error: getError } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('id', productId)
    .single()

  const { data: updatedProduct, error: updateError } = await supabase
    .from('storefront_products')
    .update({
      click_count: (product.click_count || 0) + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single()

  Healing Service

  File: src/lib/database/supabaseService.ts

  // Get Healing Page Content (lines 598-602)
  const { data, error } = await supabase
    .from('healing_page_content')
    .select('*')
    .eq('is_published', true)
    .single()

  // Get Healing Products (lines 615-619)
  const { data, error } = await supabase
    .from('healing_products')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')

  Static Data Usage (No API Calls)

  Pages Using Static Data Instead of Supabase:

  - Recipes.tsx - Uses recipesData from src/data/recipesData.ts
  - Vlogs.tsx - Uses vlogService from src/services/vlogService.ts
  - StorefrontPage.tsx - Uses static data from src/data/storefrontData.ts

  Static Data Files:

  - src/data/recipesData.ts
  - src/data/cmsData.ts
  - src/data/storefrontData.ts
  - src/services/vlogService.ts
  - src/services/recipeService.ts
  - src/services/storefrontService.ts