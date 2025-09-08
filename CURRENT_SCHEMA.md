-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Account (
  id text NOT NULL,
  userId text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT Account_pkey PRIMARY KEY (id),
  CONSTRAINT Account_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.Session (
  id text NOT NULL,
  sessionToken text NOT NULL UNIQUE,
  userId text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT Session_pkey PRIMARY KEY (id),
  CONSTRAINT Session_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.User (
  id text NOT NULL,
  name text,
  email text UNIQUE,
  emailVerified timestamp with time zone,
  image text,
  role text,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.VerificationToken (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamp with time zone NOT NULL
);
CREATE TABLE public.album_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid,
  image_path text NOT NULL,
  photo_caption text,
  photo_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT album_photos_pkey PRIMARY KEY (id),
  CONSTRAINT album_photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.photo_albums(id)
);
CREATE TABLE public.carousel_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  carousel_id uuid,
  youtube_url text NOT NULL,
  video_title text NOT NULL,
  video_description text,
  video_order integer CHECK (video_order >= 1 AND video_order <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT carousel_videos_pkey PRIMARY KEY (id),
  CONSTRAINT carousel_videos_carousel_id_fkey FOREIGN KEY (carousel_id) REFERENCES public.video_carousels(id)
);
CREATE TABLE public.healing_page_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_header text,
  hero_subtitle text,
  hero_body_paragraph text,
  hero_video_youtube_url text,
  hero_video_title text,
  hero_video_subtitle text,
  hero_video_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT healing_page_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.healing_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_image_path text,
  product_title text NOT NULL,
  product_purpose text,
  how_to_use text,
  product_link text,
  product_order integer,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  amazonUrl text,
  is_active boolean DEFAULT true,
  CONSTRAINT healing_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.home_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  background_video_path text,
  fallback_image_path text,
  hero_main_title text NOT NULL DEFAULT ''::text,
  hero_subtitle text NOT NULL DEFAULT ''::text,
  copyright_text text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_published boolean DEFAULT true,
  video_title text,
  video_description text,
  video_history jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT home_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.navigation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label character varying NOT NULL,
  url character varying NOT NULL,
  icon_name character varying,
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  is_external boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT navigation_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.page_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page character varying NOT NULL,
  section_key character varying NOT NULL,
  title character varying,
  subtitle character varying,
  body_text text,
  cta_text character varying,
  cta_url text,
  background_color character varying,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT page_sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.photo_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_title text NOT NULL,
  album_description text,
  album_date date,
  cover_image_path text,
  album_order integer UNIQUE CHECK (album_order >= 1 AND album_order <= 6),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT photo_albums_pkey PRIMARY KEY (id)
);
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  src text NOT NULL,
  alt text,
  caption text,
  display_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT photos_pkey PRIMARY KEY (id),
  CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.photo_albums(id)
);
CREATE TABLE public.recipe_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  category_slug text NOT NULL UNIQUE,
  category_description text,
  category_icon text,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recipe_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recipe_hero_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  youtube_url text NOT NULL,
  video_title text,
  video_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  video_thumbnail_url text,
  video_description text,
  is_active boolean DEFAULT true,
  video_type text DEFAULT 'reel'::text,
  CONSTRAINT recipe_hero_videos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  hero_image_path text,
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  status USER-DEFINED NOT NULL DEFAULT 'draft'::recipe_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category text,
  folder text,
  isBeginner boolean DEFAULT false,
  isRecipeOfWeek boolean DEFAULT false,
  prepTime text,
  cookTime text,
  servings integer DEFAULT 1,
  difficulty text DEFAULT 'Easy'::text,
  images ARRAY DEFAULT '{}'::text[],
  ingredients ARRAY DEFAULT '{}'::text[],
  instructions ARRAY DEFAULT '{}'::text[],
  is_favorite boolean DEFAULT false,
  CONSTRAINT recipes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recipes_page_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_title text,
  hero_subtitle text,
  hero_body_paragraph text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  hero_background_image text,
  hero_cta_text text,
  hero_cta_url text,
  beginner_section_title text DEFAULT 'Just Starting Out'::text,
  beginner_section_subtitle text DEFAULT 'Simple recipes for beginners'::text,
  show_beginner_section boolean DEFAULT true,
  page_seo_title text,
  page_seo_description text,
  CONSTRAINT recipes_page_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_media_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform character varying NOT NULL,
  url text NOT NULL,
  button_text character varying NOT NULL,
  icon_name character varying,
  page character varying,
  section character varying,
  is_visible boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_media_links_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spotify_playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playlist_title text NOT NULL,
  playlist_body_text text,
  mood_pill text,
  card_color text DEFAULT '#8B5CF6'::text,
  spotify_url text NOT NULL,
  playlist_order integer UNIQUE CHECK (playlist_order >= 1 AND playlist_order <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  description text,
  url text,
  displayOrder integer,
  isActive boolean DEFAULT true,
  previewColor text,
  stylizedTitle text,
  CONSTRAINT spotify_playlists_pkey PRIMARY KEY (id)
);
CREATE TABLE public.storefront_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE CHECK (category_name = ANY (ARRAY['Food'::text, 'Healing'::text, 'Home'::text, 'Personal Care'::text])),
  category_description text,
  category_image_path text,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT storefront_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.storefront_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_image_path text,
  product_title text NOT NULL,
  product_description text,
  category_pill text,
  amazon_url text NOT NULL,
  favorite_order integer,
  click_count integer DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tags ARRAY DEFAULT '{}'::text[],
  CONSTRAINT storefront_favorites_pkey PRIMARY KEY (id)
);
CREATE TABLE public.storefront_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  product_image_path text,
  product_title text NOT NULL,
  product_description text,
  amazon_url text NOT NULL,
  click_count integer DEFAULT 0,
  is_top_clicked boolean DEFAULT false,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text,
  imageAlt text,
  noteShort text,
  noteLong text,
  tags ARRAY DEFAULT '{}'::text[],
  isAlexisPick boolean DEFAULT false,
  showInFavorites boolean DEFAULT false,
  sortWeight integer DEFAULT 0,
  usedIn jsonb DEFAULT '[]'::jsonb,
  pairsWith ARRAY DEFAULT '{}'::text[],
  clicks30d integer DEFAULT 0,
  price numeric,
  is_favorite boolean DEFAULT false,
  CONSTRAINT storefront_products_pkey PRIMARY KEY (id),
  CONSTRAINT storefront_products_category_name_fkey FOREIGN KEY (category_name) REFERENCES public.storefront_categories(category_name)
);
CREATE TABLE public.video_carousels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  carousel_number integer NOT NULL CHECK (carousel_number = ANY (ARRAY[1, 2])),
  header text,
  subtitle text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT video_carousels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vlogs (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  published_at text,
  duration text,
  is_featured boolean DEFAULT false,
  display_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  youtube_url text,
  carousel text DEFAULT 'main-channel'::text CHECK (carousel = ANY (ARRAY['main-channel'::text, 'ag-vlogs'::text])),
  youtube_id text,
  CONSTRAINT vlogs_pkey PRIMARY KEY (id)
);