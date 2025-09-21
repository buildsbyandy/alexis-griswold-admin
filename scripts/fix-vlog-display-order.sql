-- Fix duplicate display_order values in vlogs table
-- This script assigns unique display_order values to existing vlogs

-- Update vlogs to have unique display_order values
-- First vlog (oldest by created_at) gets display_order = 1
-- Second vlog gets display_order = 2, etc.

WITH ranked_vlogs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order
  FROM vlogs
  WHERE display_order = 0 OR display_order IS NULL
)
UPDATE vlogs
SET display_order = ranked_vlogs.new_order
FROM ranked_vlogs
WHERE vlogs.id = ranked_vlogs.id;

-- Verify the update
SELECT id, title, display_order, created_at
FROM vlogs
ORDER BY display_order ASC;