-- ============================================================================
-- RECIPES DATA
-- ============================================================================

-- Insert sample recipes with realistic content
INSERT INTO recipes (
  id,
  recipe_title,
  recipe_slug,
  recipe_description,
  prep_time_minutes,
  cook_time_minutes,
  servings_count,
  difficulty_level,
  is_beginner_friendly,
  is_recipe_of_week,
  is_published,
  is_favorite,
  recipe_image_path,
  folder_name,
  created_at,
  updated_at
) VALUES 
-- Smoothie Recipes
(
  gen_random_uuid(),
  'Green Goddess Smoothie',
  'green-goddess-smoothie',
  'A nutrient-packed smoothie with spinach, banana, and tropical flavors that tastes like paradise.',
  5,
  0,
  2,
  'Easy',
  true,
  false,
  true,
  true,
  '/recipes/green-smoothie.jpg',
  'smoothies',
  now(),
  now()
),
(
  gen_random_uuid(),
  'Chocolate Peanut Butter Power Bowl',
  'chocolate-pb-power-bowl',
  'Rich, creamy, and satisfying smoothie bowl topped with fresh fruits and granola.',
  10,
  0,
  1,
  'Easy',
  true,
  true,
  true,
  false,
  '/recipes/chocolate-pb-bowl.jpg',
  'smoothies',
  now(),
  now()
),

-- Main Meals
(
  gen_random_uuid(),
  'Rainbow Buddha Bowl',
  'rainbow-buddha-bowl',
  'A colorful, nutrient-dense bowl with quinoa, roasted vegetables, and tahini dressing.',
  20,
  25,
  4,
  'Medium',
  false,
  false,
  true,
  true,
  '/recipes/buddha-bowl.jpg',
  'meals',
  now(),
  now()
),
(
  gen_random_uuid(),
  'Raw Zucchini Noodles with Pesto',
  'raw-zucchini-noodles-pesto',
  'Fresh, raw zucchini spirals tossed in homemade basil pesto for a light, refreshing meal.',
  15,
  0,
  3,
  'Easy',
  true,
  false,
  true,
  false,
  '/recipes/zucchini-noodles.jpg',
  'raw',
  now(),
  now()
),

-- Desserts
(
  gen_random_uuid(),
  'Raw Chocolate Avocado Brownies',
  'raw-chocolate-avocado-brownies',
  'Fudgy, decadent brownies made with avocado, dates, and raw cacao - no baking required!',
  15,
  0,
  9,
  'Medium',
  false,
  false,
  true,
  true,
  '/recipes/avocado-brownies.jpg',
  'desserts',
  now(),
  now()
),

-- Sauces & Dressings
(
  gen_random_uuid(),
  'Creamy Tahini Dressing',
  'creamy-tahini-dressing',
  'Versatile, creamy dressing perfect for salads, bowls, or as a dip for vegetables.',
  5,
  0,
  8,
  'Easy',
  true,
  false,
  true,
  false,
  '/recipes/tahini-dressing.jpg',
  'sauces',
  now(),
  now()
);

-- Insert ingredients for each recipe
-- Green Goddess Smoothie ingredients
WITH green_smoothie AS (
  SELECT id FROM recipes WHERE recipe_slug = 'green-goddess-smoothie' LIMIT 1
)
INSERT INTO recipe_ingredients (
  id,
  recipe_id,
  ingredient_text,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  green_smoothie.id,
  ingredient_data.text,
  ingredient_data.sort_order,
  now(),
  now()
FROM green_smoothie,
(VALUES 
  ('2 cups fresh spinach', 1),
  ('1 frozen banana', 2),
  ('1/2 cup frozen mango chunks', 3),
  ('1/2 cup frozen pineapple', 4),
  ('1 cup coconut milk', 5),
  ('1 tbsp chia seeds', 6),
  ('1 tsp fresh ginger, grated', 7),
  ('1/2 lime, juiced', 8)
) AS ingredient_data(text, sort_order);

-- Chocolate PB Power Bowl ingredients
WITH chocolate_bowl AS (
  SELECT id FROM recipes WHERE recipe_slug = 'chocolate-pb-power-bowl' LIMIT 1
)
INSERT INTO recipe_ingredients (
  id,
  recipe_id,
  ingredient_text,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  chocolate_bowl.id,
  ingredient_data.text,
  ingredient_data.sort_order,
  now(),
  now()
FROM chocolate_bowl,
(VALUES 
  ('1 frozen banana', 1),
  ('2 tbsp raw cacao powder', 2),
  ('2 tbsp natural peanut butter', 3),
  ('1/2 cup almond milk', 4),
  ('1 tsp vanilla extract', 5),
  ('1 tbsp maple syrup', 6),
  ('Toppings: granola, berries, coconut flakes', 7)
) AS ingredient_data(text, sort_order);

-- Rainbow Buddha Bowl ingredients
WITH buddha_bowl AS (
  SELECT id FROM recipes WHERE recipe_slug = 'rainbow-buddha-bowl' LIMIT 1
)
INSERT INTO recipe_ingredients (
  id,
  recipe_id,
  ingredient_text,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  buddha_bowl.id,
  ingredient_data.text,
  ingredient_data.sort_order,
  now(),
  now()
FROM buddha_bowl,
(VALUES 
  ('1 cup quinoa', 1),
  ('2 cups sweet potato, cubed', 2),
  ('1 cup broccoli florets', 3),
  ('1 bell pepper, sliced', 4),
  ('1 cup shredded purple cabbage', 5),
  ('1/2 cup chickpeas', 6),
  ('2 tbsp olive oil', 7),
  ('Salt and pepper to taste', 8),
  ('Tahini dressing for serving', 9)
) AS ingredient_data(text, sort_order);

-- Insert recipe instructions
-- Green Goddess Smoothie instructions
WITH green_smoothie AS (
  SELECT id FROM recipes WHERE recipe_slug = 'green-goddess-smoothie' LIMIT 1
)
INSERT INTO recipe_instructions (
  id,
  recipe_id,
  instruction_text,
  step_number,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  green_smoothie.id,
  instruction_data.text,
  instruction_data.step_number,
  now(),
  now()
FROM green_smoothie,
(VALUES 
  ('Add spinach and coconut milk to blender first.', 1),
  ('Add frozen banana, mango, and pineapple.', 2),
  ('Add chia seeds, grated ginger, and lime juice.', 3),
  ('Blend on high for 60-90 seconds until completely smooth.', 4),
  ('Pour into glasses and serve immediately.', 5),
  ('Optional: top with coconut flakes or extra chia seeds.', 6)
) AS instruction_data(text, step_number);

-- Chocolate PB Power Bowl instructions
WITH chocolate_bowl AS (
  SELECT id FROM recipes WHERE recipe_slug = 'chocolate-pb-power-bowl' LIMIT 1
)
INSERT INTO recipe_instructions (
  id,
  recipe_id,
  instruction_text,
  step_number,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  chocolate_bowl.id,
  instruction_data.text,
  instruction_data.step_number,
  now(),
  now()
FROM chocolate_bowl,
(VALUES 
  ('Add frozen banana, cacao powder, and peanut butter to blender.', 1),
  ('Pour in almond milk, vanilla, and maple syrup.', 2),
  ('Blend until thick and creamy (consistency of soft-serve ice cream).', 3),
  ('Pour into a bowl.', 4),
  ('Top with granola, fresh berries, and coconut flakes.', 5),
  ('Serve immediately with a spoon.', 6)
) AS instruction_data(text, step_number);

-- Insert recipe tags
INSERT INTO recipe_tags (
  id,
  recipe_id,
  tag_name,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  recipes.id,
  tag_data.tag_name,
  now(),
  now()
FROM recipes
CROSS JOIN (VALUES 
  ('vegan'),
  ('gluten-free'),
  ('raw'),
  ('healthy'),
  ('quick'),
  ('breakfast'),
  ('smoothie'),
  ('bowl'),
  ('plant-based'),
  ('dairy-free')
) AS tag_data(tag_name)
WHERE 
  (recipes.recipe_slug = 'green-goddess-smoothie' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'raw', 'healthy', 'quick', 'breakfast', 'smoothie')) OR
  (recipes.recipe_slug = 'chocolate-pb-power-bowl' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'raw', 'healthy', 'breakfast', 'smoothie', 'bowl')) OR
  (recipes.recipe_slug = 'rainbow-buddha-bowl' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'healthy', 'bowl', 'plant-based')) OR
  (recipes.recipe_slug = 'raw-zucchini-noodles-pesto' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'raw', 'healthy', 'plant-based')) OR
  (recipes.recipe_slug = 'raw-chocolate-avocado-brownies' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'raw', 'dairy-free')) OR
  (recipes.recipe_slug = 'creamy-tahini-dressing' AND tag_data.tag_name IN ('vegan', 'gluten-free', 'raw', 'quick'));