-- ============================================================================
-- STOREFRONT PRODUCTS DATA
-- ============================================================================

-- Insert storefront products with realistic content
INSERT INTO storefront_products (
  id,
  product_title,
  product_slug,
  product_description,
  detailed_description,
  price_cents,
  category,
  status,
  is_alexis_pick,
  is_favorite,
  product_image_path,
  affiliate_link,
  sort_weight,
  created_at,
  updated_at
) VALUES 

-- Kitchen Category
(
  gen_random_uuid(),
  'Vitamix Professional Blender',
  'vitamix-professional-blender',
  'High-performance blender perfect for smoothies, soups, and nut butters.',
  'The Vitamix Professional Series 750 is a game-changer in the kitchen. With its powerful motor and precision blades, it creates the smoothest smoothies, creamiest soups, and can even make hot soup through friction heating. I use mine daily for my morning smoothies and weekly meal prep. The tamper tool helps blend thick mixtures perfectly, and the self-cleaning feature makes cleanup a breeze.',
  54900,
  'Kitchen',
  'Published',
  true,
  true,
  '/products/vitamix-blender.jpg',
  'https://amazon.com/vitamix-professional-blender',
  1,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Bamboo Cutting Board Set',
  'bamboo-cutting-board-set',
  'Sustainable bamboo cutting boards in multiple sizes for all your prep needs.',
  'These beautiful bamboo cutting boards are not only eco-friendly but also naturally antimicrobial. The set includes three different sizes perfect for everything from chopping herbs to slicing large vegetables. Bamboo is gentler on knife blades than hardwood and the natural grain pattern adds beauty to your kitchen. Easy to clean and maintain.',
  4500,
  'Kitchen',
  'Published',
  false,
  false,
  '/products/bamboo-cutting-board.jpg',
  'https://amazon.com/bamboo-cutting-board-set',
  2,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Glass Food Storage Containers',
  'glass-food-storage-containers',
  'Airtight glass containers perfect for meal prep and food storage.',
  'Say goodbye to plastic! These borosilicate glass containers are perfect for storing leftovers, meal prepping, and keeping ingredients fresh. They''re oven, microwave, and dishwasher safe. The airtight lids prevent spills and keep food fresh longer. I love that I can see what''s inside and they don''t retain odors or stains like plastic containers do.',
  3200,
  'Kitchen',
  'Published',
  true,
  false,
  '/products/glass-containers.jpg',
  'https://amazon.com/glass-food-storage',
  3,
  now(),
  now()
),

-- Wellness Category
(
  gen_random_uuid(),
  'Himalayan Salt Lamp',
  'himalayan-salt-lamp',
  'Natural air purifier that creates a warm, calming ambiance.',
  'This beautiful Himalayan salt lamp not only provides a warm, soothing glow but is believed to help purify the air and create negative ions. I keep one in my bedroom and one in my meditation space. The natural pink salt crystal sits on a wooden base and creates the perfect ambiance for relaxation and evening wind-down routines.',
  2800,
  'Wellness',
  'Published',
  false,
  true,
  '/products/salt-lamp.jpg',
  'https://amazon.com/himalayan-salt-lamp',
  4,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Essential Oil Diffuser',
  'essential-oil-diffuser',
  'Ultrasonic diffuser with color-changing LED lights for aromatherapy.',
  'This sleek ultrasonic diffuser disperses essential oils evenly throughout your space while the color-changing LED lights create a spa-like atmosphere. It runs quietly for hours and has multiple timer settings. Perfect for creating a calming environment during meditation, yoga, or just relaxing at home. I love using lavender oil in the evening and peppermint during morning workouts.',
  3500,
  'Wellness',
  'Published',
  true,
  true,
  '/products/oil-diffuser.jpg',
  'https://amazon.com/essential-oil-diffuser',
  5,
  now(),
  now()
),

-- Beauty Category
(
  gen_random_uuid(),
  'Jade Facial Roller Set',
  'jade-facial-roller-set',
  'Traditional jade tools for facial massage and lymphatic drainage.',
  'This jade roller and gua sha set has become an essential part of my morning skincare routine. The cool jade stone helps reduce puffiness, improve circulation, and enhance the absorption of serums and oils. The larger roller is perfect for the face and neck, while the smaller end works great around the delicate eye area. Includes a gua sha tool for deeper tissue massage.',
  1800,
  'Beauty',
  'Published',
  false,
  false,
  '/products/jade-roller.jpg',
  'https://amazon.com/jade-facial-roller',
  6,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Organic Rosehip Seed Oil',
  'organic-rosehip-seed-oil',
  'Pure, cold-pressed rosehip oil for skin hydration and anti-aging.',
  'This organic rosehip seed oil is a powerhouse for skin health. Rich in vitamins A and C, it helps with skin regeneration, reduces the appearance of scars and fine lines, and provides deep hydration without clogging pores. I use a few drops every night after cleansing. The oil absorbs quickly and leaves skin soft and glowing by morning.',
  2400,
  'Beauty',
  'Published',
  true,
  false,
  '/products/rosehip-oil.jpg',
  'https://amazon.com/organic-rosehip-oil',
  7,
  now(),
  now()
),

-- Fitness Category
(
  gen_random_uuid(),
  'Cork Yoga Mat',
  'cork-yoga-mat',
  'Eco-friendly cork yoga mat with natural grip and cushioning.',
  'This cork yoga mat is my go-to for daily practice. Cork provides natural antimicrobial properties and excellent grip that actually improves with moisture - perfect for hot yoga or sweaty sessions. The natural rubber base provides cushioning and stability. It''s also completely biodegradable and sustainable. The surface feels amazing and the grip is unmatched.',
  7800,
  'Fitness',
  'Published',
  true,
  true,
  '/products/cork-yoga-mat.jpg',
  'https://amazon.com/cork-yoga-mat',
  8,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Resistance Band Set',
  'resistance-band-set',
  'Complete resistance band system for full-body workouts anywhere.',
  'This resistance band set has revolutionized my home workouts. It includes multiple resistance levels, door anchor, handles, and ankle straps. Perfect for strength training, physical therapy, or adding resistance to yoga flows. The bands are durable and the variety of attachments makes it incredibly versatile. I can get a full-body workout anywhere.',
  3900,
  'Fitness',
  'Published',
  false,
  false,
  '/products/resistance-bands.jpg',
  'https://amazon.com/resistance-band-set',
  9,
  now(),
  now()
),

-- Lifestyle Category
(
  gen_random_uuid(),
  'Meditation Cushion',
  'meditation-cushion',
  'Comfortable buckwheat hull cushion for meditation practice.',
  'This meditation cushion has transformed my daily practice. Filled with organic buckwheat hulls that conform to your body and provide stable support. The removable cover is machine washable and the height is perfect for maintaining proper posture during longer meditation sessions. The natural materials and beautiful design make it a lovely addition to any meditation space.',
  4200,
  'Lifestyle',
  'Published',
  false,
  true,
  '/products/meditation-cushion.jpg',
  'https://amazon.com/meditation-cushion',
  10,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Gratitude Journal',
  'gratitude-journal',
  'Beautifully designed journal for daily gratitude and mindfulness practice.',
  'This gratitude journal has become an integral part of my morning routine. With guided prompts and beautiful illustrations, it makes daily reflection a joy. The high-quality paper feels wonderful to write on and the hardcover binding ensures it will last. Studies show that regular gratitude practice can improve mood, sleep, and overall well-being.',
  1600,
  'Lifestyle',
  'Published',
  true,
  false,
  '/products/gratitude-journal.jpg',
  'https://amazon.com/gratitude-journal',
  11,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Organic Cotton Tote Bag',
  'organic-cotton-tote-bag',
  'Sustainable tote bag perfect for grocery shopping and daily errands.',
  'This organic cotton tote bag is both stylish and sustainable. Made from GOTS-certified organic cotton, it''s durable enough to carry heavy groceries and beautiful enough for everyday use. The reinforced handles and spacious design make it perfect for farmer''s market trips, beach days, or carrying yoga gear. Machine washable and gets softer with each wash.',
  1200,
  'Lifestyle',
  'Published',
  false,
  false,
  '/products/cotton-tote.jpg',
  'https://amazon.com/organic-cotton-tote',
  12,
  now(),
  now()
);

-- Insert product tags
INSERT INTO storefront_product_tags (
  id,
  product_id,
  tag_name,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  storefront_products.id,
  tag_data.tag_name,
  now(),
  now()
FROM storefront_products
CROSS JOIN (VALUES 
  ('eco-friendly'),
  ('organic'),
  ('sustainable'),
  ('kitchen'),
  ('wellness'),
  ('beauty'),
  ('fitness'),
  ('lifestyle'),
  ('daily-use'),
  ('self-care'),
  ('natural'),
  ('high-quality')
) AS tag_data(tag_name)
WHERE 
  (storefront_products.product_slug = 'vitamix-professional-blender' AND tag_data.tag_name IN ('kitchen', 'daily-use', 'high-quality')) OR
  (storefront_products.product_slug = 'bamboo-cutting-board-set' AND tag_data.tag_name IN ('eco-friendly', 'sustainable', 'kitchen')) OR
  (storefront_products.product_slug = 'glass-food-storage-containers' AND tag_data.tag_name IN ('eco-friendly', 'kitchen', 'daily-use')) OR
  (storefront_products.product_slug = 'himalayan-salt-lamp' AND tag_data.tag_name IN ('wellness', 'natural', 'self-care')) OR
  (storefront_products.product_slug = 'essential-oil-diffuser' AND tag_data.tag_name IN ('wellness', 'self-care', 'daily-use')) OR
  (storefront_products.product_slug = 'jade-facial-roller-set' AND tag_data.tag_name IN ('beauty', 'self-care', 'natural')) OR
  (storefront_products.product_slug = 'organic-rosehip-seed-oil' AND tag_data.tag_name IN ('organic', 'beauty', 'natural')) OR
  (storefront_products.product_slug = 'cork-yoga-mat' AND tag_data.tag_name IN ('eco-friendly', 'fitness', 'sustainable')) OR
  (storefront_products.product_slug = 'resistance-band-set' AND tag_data.tag_name IN ('fitness', 'daily-use', 'high-quality')) OR
  (storefront_products.product_slug = 'meditation-cushion' AND tag_data.tag_name IN ('wellness', 'lifestyle', 'organic')) OR
  (storefront_products.product_slug = 'gratitude-journal' AND tag_data.tag_name IN ('lifestyle', 'self-care', 'daily-use')) OR
  (storefront_products.product_slug = 'organic-cotton-tote-bag' AND tag_data.tag_name IN ('organic', 'sustainable', 'eco-friendly'));