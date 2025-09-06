-- ============================================================================
-- HEALING PAGE DATA
-- ============================================================================

-- Insert healing page content
INSERT INTO healing_page_content (
  id,
  hero_main_title,
  hero_main_subtitle,
  hero_body_paragraph,
  hero_video_youtube_url,
  hero_video_title,
  hero_video_subtitle,
  hero_video_date,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'HEALING',
  'Your journey to wellness starts here.',
  'From gut health to holistic healing, discover natural methods to restore your body''s balance and vitality. Every step of this journey is guided by science-backed approaches and time-tested remedies that honor your body''s innate healing wisdom.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Healing Journey Introduction',
  'Current',
  '2024-01-15',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Get healing page ID for foreign key references
WITH healing_page AS (
  SELECT id FROM healing_page_content LIMIT 1
)

-- Insert healing video carousels
INSERT INTO healing_video_carousels (
  id,
  healing_page_id,
  carousel_name,
  carousel_subtitle,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  healing_page.id,
  carousel_data.name,
  carousel_data.subtitle,
  carousel_data.sort_order,
  carousel_data.is_active,
  now(),
  now()
FROM healing_page,
(VALUES 
  ('Gut Healing Part 1: Candida Cleanse', 'Educational videos for candida cleansing process', 1, true),
  ('Gut Healing Part 2: Rebuild & Repair', 'Videos focused on rebuilding gut health after cleansing', 2, true)
) AS carousel_data(name, subtitle, sort_order, is_active)
ON CONFLICT DO NOTHING;

-- Insert healing videos for Part 1: Candida Cleanse
WITH part1_carousel AS (
  SELECT id FROM healing_video_carousels WHERE carousel_name = 'Gut Healing Part 1: Candida Cleanse' LIMIT 1
)
INSERT INTO healing_carousel_videos (
  id,
  carousel_id,
  youtube_url,
  video_title,
  video_description,
  thumbnail_url,
  duration,
  sort_order,
  is_featured,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  part1_carousel.id,
  video_data.youtube_url,
  video_data.title,
  video_data.description,
  video_data.thumbnail_url,
  video_data.duration,
  video_data.sort_order,
  video_data.is_featured,
  now(),
  now()
FROM part1_carousel,
(VALUES 
  ('https://www.youtube.com/watch?v=candida1', 'Candida Cleanse Introduction', 'Understanding candida overgrowth and the cleansing process', 'https://img.youtube.com/vi/candida1/hqdefault.jpg', '12:45', 1, false),
  ('https://www.youtube.com/watch?v=anticandida', 'Anti-Candida Diet Plan', 'Foods to eat and avoid during candida cleanse', 'https://img.youtube.com/vi/anticandida/hqdefault.jpg', '15:20', 2, false),
  ('https://www.youtube.com/watch?v=dieoff', 'Candida Die-Off Symptoms', 'Managing detox symptoms during cleansing', 'https://img.youtube.com/vi/dieoff/hqdefault.jpg', '9:33', 3, false),
  ('https://www.youtube.com/watch?v=antifungal', 'Natural Antifungal Supplements', 'Best supplements to support candida cleanse', 'https://img.youtube.com/vi/antifungal/hqdefault.jpg', '11:15', 4, false)
) AS video_data(youtube_url, title, description, thumbnail_url, duration, sort_order, is_featured)
ON CONFLICT DO NOTHING;

-- Insert healing videos for Part 2: Rebuild & Repair
WITH part2_carousel AS (
  SELECT id FROM healing_video_carousels WHERE carousel_name = 'Gut Healing Part 2: Rebuild & Repair' LIMIT 1
)
INSERT INTO healing_carousel_videos (
  id,
  carousel_id,
  youtube_url,
  video_title,
  video_description,
  thumbnail_url,
  duration,
  sort_order,
  is_featured,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  part2_carousel.id,
  video_data.youtube_url,
  video_data.title,
  video_data.description,
  video_data.thumbnail_url,
  video_data.duration,
  video_data.sort_order,
  video_data.is_featured,
  now(),
  now()
FROM part2_carousel,
(VALUES 
  ('https://www.youtube.com/watch?v=microbiome', 'Gut Microbiome Restoration', 'Rebuilding healthy gut bacteria', 'https://img.youtube.com/vi/microbiome/hqdefault.jpg', '14:20', 1, false),
  ('https://www.youtube.com/watch?v=probiotics', 'Probiotic Foods Guide', 'Best fermented foods for gut health', 'https://img.youtube.com/vi/probiotics/hqdefault.jpg', '10:45', 2, false),
  ('https://www.youtube.com/watch?v=leakygut', 'Healing Leaky Gut', 'Repairing intestinal permeability', 'https://img.youtube.com/vi/leakygut/hqdefault.jpg', '16:30', 3, false),
  ('https://www.youtube.com/watch?v=maintenance', 'Post-Cleanse Maintenance', 'Maintaining gut health long-term', 'https://img.youtube.com/vi/maintenance/hqdefault.jpg', '13:10', 4, false)
) AS video_data(youtube_url, title, description, thumbnail_url, duration, sort_order, is_featured)
ON CONFLICT DO NOTHING;

-- Insert healing products/supplements
INSERT INTO healing_products (
  id,
  product_name,
  product_description,
  usage_instructions,
  product_image_path,
  affiliate_link,
  sort_order,
  is_featured,
  is_published,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Garden of Life Probiotics',
  'Restore healthy gut bacteria and support immune function',
  'Take 1 capsule daily with food, preferably in the morning',
  '/products/garden-of-life-probiotics.jpg',
  'https://amazon.com/garden-of-life-probiotics',
  1,
  true,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Vital Proteins Collagen',
  'Support gut lining repair and promote skin health',
  'Mix 1-2 scoops into coffee, smoothies, or water daily',
  '/products/vital-proteins-collagen.jpg',
  'https://amazon.com/vital-proteins-collagen',
  2,
  true,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Enzymedica Digest Gold',
  'Improve nutrient absorption and reduce digestive discomfort',
  'Take 1-2 capsules with each meal as needed',
  '/products/enzymedica-digest-gold.jpg',
  'https://amazon.com/enzymedica-digest-gold',
  3,
  true,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Thorne Research Berberine',
  'Support healthy blood sugar and antimicrobial activity',
  'Take 1 capsule twice daily before meals',
  '/products/thorne-berberine.jpg',
  'https://amazon.com/thorne-berberine',
  4,
  false,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'NOW Foods L-Glutamine Powder',
  'Support intestinal lining repair and recovery',
  'Mix 1 teaspoon in water or smoothie, 2-3 times daily',
  '/products/now-l-glutamine.jpg',
  'https://amazon.com/now-l-glutamine',
  5,
  false,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Designs for Health GI-Revive',
  'Comprehensive gut healing and repair formula',
  'Mix 1 scoop with water twice daily between meals',
  '/products/gi-revive.jpg',
  'https://amazon.com/designs-health-gi-revive',
  6,
  false,
  true,
  now(),
  now()
);