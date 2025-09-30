-- Query 1: Verify Core Table Counts
| table_name     | count |
| -------------- | ----- |
| carousels      | 15    |
| carousel_items | 1     |
| vlogs          | 2     |
| recipes        | 1     |
| photo_albums   | 0     |

-- Query 2: Verify the Unified View is Working
| carousel_page | carousel_slug   | item_kind | item_caption              |
| ------------- | --------------- | --------- | ------------------------- |
| healing       | healing-tiktoks | tiktok    | Demo TikTok Healing Video |

-- Query 3: Verify Legacy Tables are Gone
Success, no rows returned (no legacy tables)

-- Query 4: Verify Security Policies are Active
| schemaname | tablename             | policyname                                     | roles           | cmd    | security_condition                                       |
| ---------- | --------------------- | ---------------------------------------------- | --------------- | ------ | -------------------------------------------------------- |
| public     | album_photos          | Authenticated can manage album_photos          | {authenticated} | ALL    | true                                                     |
| public     | carousel_items        | Authenticated can manage carousel_items        | {authenticated} | ALL    | true                                                     |
| public     | carousel_items        | Public can view active carousel items          | {anon}          | SELECT | (is_active = true)                                       |
| public     | carousels             | Authenticated can manage carousels             | {authenticated} | ALL    | true                                                     |
| public     | carousels             | Public can view active carousels               | {anon}          | SELECT | (is_active = true)                                       |
| public     | healing_page_content  | Authenticated can manage healing_page_content  | {authenticated} | ALL    | true                                                     |
| public     | healing_page_content  | Public can view healing page content           | {anon}          | SELECT | true                                                     |
| public     | healing_products      | Authenticated can manage healing_products      | {authenticated} | ALL    | true                                                     |
| public     | healing_products      | Public can view published healing products     | {anon}          | SELECT | (status = 'published'::content_status)                   |
| public     | home_content          | Authenticated can manage home_content          | {authenticated} | ALL    | true                                                     |
| public     | home_content          | Public can view published home content         | {anon}          | SELECT | (is_published = true)                                    |
| public     | navigation_items      | Authenticated can manage navigation_items      | {authenticated} | ALL    | true                                                     |
| public     | navigation_items      | Public can view visible navigation items       | {anon}          | SELECT | (is_visible = true)                                      |
| public     | photo_albums          | Authenticated can manage photo_albums          | {authenticated} | ALL    | true                                                     |
| public     | photos                | Authenticated can manage photos                | {authenticated} | ALL    | true                                                     |
| public     | recipe_categories     | Authenticated can manage recipe_categories     | {authenticated} | ALL    | true                                                     |
| public     | recipe_categories     | Public can view visible recipe categories      | {anon}          | SELECT | (is_visible = true)                                      |
| public     | recipe_folders        | Authenticated can manage recipe_folders        | {authenticated} | ALL    | true                                                     |
| public     | recipe_folders        | Public can view visible recipe folders         | {anon}          | SELECT | (is_visible = true)                                      |
| public     | recipes               | Authenticated can manage recipes               | {authenticated} | ALL    | true                                                     |
| public     | recipes               | Public can view published recipes              | {anon}          | SELECT | (status = 'published'::recipe_status)                    |
| public     | recipes_page_content  | Authenticated can manage recipes_page_content  | {authenticated} | ALL    | true                                                     |
| public     | recipes_page_content  | Public can view recipes page content           | {anon}          | SELECT | true                                                     |
| public     | social_media_links    | Authenticated can manage social_media_links    | {authenticated} | ALL    | true                                                     |
| public     | social_media_links    | Public can view visible social media links     | {anon}          | SELECT | (is_visible = true)                                      |
| public     | spotify_playlists     | Authenticated can manage spotify_playlists     | {authenticated} | ALL    | true                                                     |
| public     | storefront_categories | Authenticated can manage storefront_categories | {authenticated} | ALL    | true                                                     |
| public     | storefront_categories | Public can view visible storefront categories  | {anon}          | SELECT | (is_visible = true)                                      |
| public     | storefront_products   | Authenticated can manage storefront_products   | {authenticated} | ALL    | true                                                     |
| public     | storefront_products   | Public can view published storefront products  | {anon}          | SELECT | (status = 'published'::content_status)                   |
| public     | vlogs                 | Authenticated can manage vlogs                 | {authenticated} | ALL    | true                                                     |
| public     | vlogs                 | Public can view published vlogs                | {anon}          | SELECT | ((published_at IS NOT NULL) AND (published_at <= now())) |