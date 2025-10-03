-- Add thumbnail_path and use_color_overlay columns to spotify_playlists table
-- This allows playlists to have custom thumbnail images with optional color overlay

-- Add thumbnail_path column (nullable, stores Supabase storage URL)
ALTER TABLE spotify_playlists
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- Add use_color_overlay column (boolean, defaults to false)
ALTER TABLE spotify_playlists
ADD COLUMN IF NOT EXISTS use_color_overlay BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN spotify_playlists.thumbnail_path IS 'Supabase storage URL for custom playlist thumbnail image (optional)';
COMMENT ON COLUMN spotify_playlists.use_color_overlay IS 'Whether to overlay card_color on top of thumbnail_path (default: false)';
