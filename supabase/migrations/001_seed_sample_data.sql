-- Sample Data Migration for Alexis Griswold Admin Dashboard
-- This migration populates the database with sample data to give admins
-- a starting point with realistic examples

-- ============================================================================
-- HOME PAGE CONTENT
-- ============================================================================

INSERT INTO home_content (
  id,
  background_video_path,
  background_image_path,
  hero_main_title,
  hero_subtitle,
  copyright_text,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '/alexisHome.mp4',
  '/public/images/home-fallback.jpg',
  'Welcome to Alexis Griswold',
  'Experience wellness, recipes, and lifestyle content',
  '© 2025 Alexis Griswold',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VLOGS PAGE CONTENT
-- ============================================================================

-- Insert vlogs page content
INSERT INTO vlogs_page_content (
  id,
  hero_main_title,
  hero_main_subtitle,
  hero_body_paragraph,
  hero_youtube_url,
  hero_video_title,
  hero_video_subtitle,
  hero_video_date,
  youtube_channel_url,
  tiktok_profile_url,
  is_published,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'VLOGS',
  'Step into my life — one video at a time.',
  'Every moment captured, every story shared, every adventure lived. My vlogs are windows into a life filled with passion, purpose, and the simple joys that make each day extraordinary.',
  'https://www.youtube.com/watch?v=MYmmbSZ4YaQ',
  'Morning Routine & Healthy Breakfast',
  'Current',
  '2024-01-15',
  'https://www.youtube.com/@alexisgriswold',
  'https://www.tiktok.com/@alexisgriswold',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Get the vlogs page ID for foreign key references
WITH vlogs_page AS (
  SELECT id FROM vlogs_page_content LIMIT 1
)

-- Insert video carousels
INSERT INTO video_carousels (
  id,
  vlogs_page_id,
  carousel_name,
  carousel_subtitle,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  vlogs_page.id,
  carousel_data.name,
  carousel_data.subtitle,
  carousel_data.sort_order,
  carousel_data.is_active,
  now(),
  now()
FROM vlogs_page,
(VALUES 
  ('Main Channel Carousel', 'A Life with Alexis Griswold - Main YouTube Channel', 1, true),
  ('AG Vlogs Carousel', 'AG Vlogs - Personal YouTube Channel', 2, true)
) AS carousel_data(name, subtitle, sort_order, is_active)
ON CONFLICT DO NOTHING;

-- Insert sample videos for Main Channel Carousel
WITH main_carousel AS (
  SELECT id FROM video_carousels WHERE carousel_name = 'Main Channel Carousel' LIMIT 1
)
INSERT INTO carousel_videos (
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
  main_carousel.id,
  video_data.youtube_url,
  video_data.title,
  video_data.description,
  video_data.thumbnail_url,
  video_data.duration,
  video_data.sort_order,
  video_data.is_featured,
  now(),
  now()
FROM main_carousel,
(VALUES 
  ('https://www.youtube.com/watch?v=MYmmbSZ4YaQ', 'Morning Routine & Healthy Breakfast', 'Start your day with energy and intention', 'https://img.youtube.com/vi/MYmmbSZ4YaQ/hqdefault.jpg', '8:32', 1, true),
  ('https://www.youtube.com/watch?v=6AvOegDnEb0', 'Raw Vegan Meal Prep', 'Simple and delicious plant-based meals', 'https://img.youtube.com/vi/6AvOegDnEb0/hqdefault.jpg', '12:45', 2, false),
  ('https://www.youtube.com/watch?v=qBXducGwqxY', 'Travel Vlog: Arizona Adventures', 'Exploring the beautiful desert landscapes', 'https://img.youtube.com/vi/qBXducGwqxY/hqdefault.jpg', '18:20', 3, false)
) AS video_data(youtube_url, title, description, thumbnail_url, duration, sort_order, is_featured)
ON CONFLICT DO NOTHING;

-- Insert sample videos for AG Vlogs Carousel
WITH ag_carousel AS (
  SELECT id FROM video_carousels WHERE carousel_name = 'AG Vlogs Carousel' LIMIT 1
)
INSERT INTO carousel_videos (
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
  ag_carousel.id,
  video_data.youtube_url,
  video_data.title,
  video_data.description,
  video_data.thumbnail_url,
  video_data.duration,
  video_data.sort_order,
  video_data.is_featured,
  now(),
  now()
FROM ag_carousel,
(VALUES 
  ('https://www.youtube.com/watch?v=JFgukuIduPs', 'Smoothie Bowl Tutorial', 'How to make Instagram-worthy smoothie bowls', 'https://img.youtube.com/vi/JFgukuIduPs/hqdefault.jpg', '6:15', 1, false),
  ('https://www.youtube.com/watch?v=1qilUaxl5Ss', 'Self-Care Sunday Routine', 'Nurturing mind, body, and soul', 'https://img.youtube.com/vi/1qilUaxl5Ss/hqdefault.jpg', '14:28', 2, false),
  ('https://www.youtube.com/watch?v=j43tVo2Y07E', 'Kitchen Organization Tips', 'Creating a functional and beautiful space', 'https://img.youtube.com/vi/j43tVo2Y07E/hqdefault.jpg', '11:42', 3, false)
) AS video_data(youtube_url, title, description, thumbnail_url, duration, sort_order, is_featured)
ON CONFLICT DO NOTHING;

-- Insert photo albums
INSERT INTO photo_albums (
  id,
  vlogs_page_id,
  album_title,
  album_subtitle,
  album_description,
  cover_image_path,
  album_date,
  sort_order,
  is_featured,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  vlogs_page.id,
  album_data.title,
  album_data.subtitle,
  album_data.description,
  album_data.cover_image,
  album_data.album_date::date,
  album_data.sort_order,
  album_data.is_featured,
  now(),
  now()
FROM (SELECT id FROM vlogs_page_content LIMIT 1) vlogs_page,
(VALUES 
  ('Morning Rituals', 'Daily Intentions', 'Start your day with intention', '/img1.JPEG', '2024-01-15', 1, true),
  ('Desert Adventures', 'Arizona Landscapes', 'Exploring Arizona landscapes', '/img3.jpg', '2024-01-10', 2, false),
  ('Healthy Creations', 'Plant-Based Living', 'Plant-based meal prep', '/img4.JPG', '2024-01-08', 3, false),
  ('Wellness Journey', 'Mind Body Soul', 'Mind, body, and soul care', '/img6.jpg', '2024-01-05', 4, false),
  ('Home Sweet Home', 'Beautiful Spaces', 'Creating beautiful spaces', '/test_1.JPG', '2024-01-03', 5, false),
  ('Fitness & Movement', 'Active Living', 'Staying active and energized', '/test_1.JPG', '2024-01-01', 6, false)
) AS album_data(title, subtitle, description, cover_image, album_date, sort_order, is_featured)
ON CONFLICT DO NOTHING;

-- Insert Spotify playlists
INSERT INTO spotify_playlists (
  id,
  vlogs_page_id,
  playlist_name,
  playlist_description,
  spotify_url,
  preview_color,
  stylized_title,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  vlogs_page.id,
  playlist_data.name,
  playlist_data.description,
  playlist_data.url,
  playlist_data.color,
  playlist_data.title,
  playlist_data.sort_order,
  playlist_data.is_active,
  now(),
  now()
FROM (SELECT id FROM vlogs_page_content LIMIT 1) vlogs_page,
(VALUES 
  ('Switching Timezones', 'Chill vibes for any time zone', 'https://open.spotify.com/playlist/4i1BwxDwkjbJNGvhnhEH5P', '#2D2D2D', '🌅 Switching Timezones 🌇', 1, true),
  ('Soulmates', 'Music for deeper connections', 'https://open.spotify.com/playlist/4Bp1HuaVuGrjJRz10hWfkf', '#E91429', '🏵️ Soulmates 🏵️', 2, true),
  ('Ready 4 Summer', 'Summer energy and good vibes', 'https://open.spotify.com/playlist/7uZas1QudcmrU21IUtwd5Q', '#1E3A8A', '🏖️ Ready 4 Summer 💦', 3, true)
) AS playlist_data(name, description, url, color, title, sort_order, is_active)
ON CONFLICT DO NOTHING;