# Admin CMS API Documentation

This document provides comprehensive API documentation for the Alexis Griswold Admin CMS (Next.js) that can be consumed by the sister public Vite repository.

## Base URL
```
https://your-admin-cms-domain.com/api
```

## Authentication
All POST, PUT, DELETE operations require authentication via NextAuth session cookies.

## API Endpoints

### Home Page Content

#### GET `/api/home`
Get home page content including video background, fallback image, hero text, and video history.

**Response:**
```json
{
  "content": {
    "background_video_path": "string | null",
    "fallback_image_path": "string | null", 
    "hero_main_title": "string",
    "hero_subtitle": "string",
    "video_title": "string | null",
    "video_description": "string | null",
    "video_history": [
      {
        "path": "string",
        "uploaded_at": "string",
        "title": "string"
      }
    ],
    "copyright_text": "string"
  }
}
```

#### PUT `/api/home`
Update home page content.

**Request Body:**
```json
{
  "background_video_path": "string",
  "fallback_image_path": "string",
  "hero_main_title": "string",
  "hero_subtitle": "string", 
  "video_title": "string",
  "video_description": "string",
  "videoOpacity": "number"
}
```

### Spotify Playlists

#### GET `/api/playlists`
Get all Spotify playlists.

**Response:**
```json
{
  "playlists": [
    {
      "id": "string",
      "playlist_title": "string",
      "description": "string | null",
      "card_color": "string | null",
      "spotify_url": "string",
      "playlist_order": "number | null",
      "is_active": "boolean | null",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

#### GET `/api/playlists/section-config`
Get Spotify section configuration (headers).

**Response:**
```json
{
  "config": {
    "section_title": "string",
    "section_subtitle": "string"
  }
}
```

#### PUT `/api/playlists/section-config`
Update Spotify section configuration.

**Request Body:**
```json
{
  "section_title": "string",
  "section_subtitle": "string"
}
```

#### POST `/api/playlists`
Create a new Spotify playlist.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "theme_color": "string",
  "spotify_url": "string",
  "display_order": "number (1-3)",
  "is_active": "boolean"
}
```

### Storefront Products

#### GET `/api/storefront`
Get all storefront products.

**Query Parameters:**
- `query`: Search query
- `category_slug`: Filter by category
- `status`: Filter by status (draft, published, archived)
- `limit`: Number of results
- `offset`: Pagination offset
- `sortBy`: Sort field
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "product_title": "string",
      "description": "string | null",
      "amazon_url": "string",
      "price": "number | null",
      "image_path": "string | null",
      "image_alt": "string | null",
      "category_slug": "string | null",
      "status": "draft | published | archived",
      "tags": "string[] | null",
      "click_count": "number | null",
      "is_top_clicked": "boolean | null",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

#### GET `/api/storefront/categories`
Get all storefront categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "is_active": "boolean | null",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

### Healing Products

#### GET `/api/healing/products`
Get all healing products.

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "product_title": "string",
      "product_purpose": "string | null",
      "how_to_use": "string | null",
      "product_image_path": "string | null",
      "amazon_url": "string | null",
      "is_active": "boolean | null",
      "product_order": "number | null",
      "status": "draft | published | archived",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

#### GET `/api/healing/carousel-headers`
Get healing carousel headers.

**Response:**
```json
{
  "data": [
    {
      "type": "part1 | part2",
      "title": "string",
      "description": "string",
      "is_active": "boolean"
    }
  ]
}
```

#### GET `/api/healing/carousel-videos`
Get healing carousel videos.

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "carousel_id": "string | null",
      "youtube_url": "string",
      "youtube_id": "string | null",
      "video_title": "string",
      "video_description": "string | null",
      "video_order": "number",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

### Recipes

#### GET `/api/recipes`
Get all recipes.

**Response:**
```json
{
  "recipes": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "ingredients": "string[]",
      "instructions": "string[]",
      "prep_time": "number | null",
      "cook_time": "number | null",
      "servings": "number | null",
      "difficulty": "easy | medium | hard",
      "category": "string | null",
      "image_path": "string | null",
      "is_featured": "boolean",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

#### GET `/api/recipes/page-content`
Get recipe page content.

**Response:**
```json
{
  "content": {
    "hero_title": "string",
    "hero_subtitle": "string",
    "hero_body_paragraph": "string | null",
    "hero_background_image": "string | null",
    "beginner_section_title": "string",
    "beginner_section_subtitle": "string",
    "show_beginner_section": "boolean",
    "page_seo_title": "string",
    "page_seo_description": "string"
  }
}
```

### Vlogs

#### GET `/api/vlogs`
Get all vlogs.

**Response:**
```json
{
  "vlogs": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "youtube_url": "string",
      "youtube_id": "string | null",
      "thumbnail_url": "string | null",
      "published_at": "string | null",
      "duration": "string | null",
      "carousel": "main-channel | ag-vlogs",
      "is_featured": "boolean",
      "display_order": "number",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

### Photo Albums

#### GET `/api/albums`
Get all photo albums.

**Response:**
```json
{
  "albums": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "cover_image": "string | null",
      "photo_count": "number",
      "is_featured": "boolean",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

## File Upload Endpoints

### POST `/api/storage/signed-upload`
Get signed URL for file upload.

**Request Body:**
```json
{
  "fileName": "string",
  "fileType": "string",
  "bucket": "string"
}
```

**Response:**
```json
{
  "signedUrl": "string",
  "publicUrl": "string"
}
```

### GET `/api/storage/get-signed-url`
Get signed URL for file access.

**Query Parameters:**
- `filePath`: Path to file
- `bucket`: Storage bucket name

**Response:**
```json
{
  "signedUrl": "string"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message string"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `405`: Method Not Allowed
- `500`: Internal Server Error

## Data Types

### Content Status Enum
```
"draft" | "published" | "archived"
```

### Difficulty Enum
```
"easy" | "medium" | "hard"
```

### Vlog Carousel Types
```
"main-channel" | "ag-vlogs"
```

### Healing Parts
```
"part1" | "part2"
```

## Notes for Sister Repo Integration

1. **Authentication**: The public repo should not need authentication for GET requests, but POST/PUT/DELETE operations require admin authentication.

2. **CORS**: Ensure CORS is properly configured if the public repo is on a different domain.

3. **Error Handling**: Always check for error responses and handle them gracefully.

4. **Pagination**: Some endpoints support pagination via `limit` and `offset` parameters.

5. **File Uploads**: Use the signed upload endpoints for secure file uploads to Supabase storage.

6. **Real-time Updates**: Consider implementing WebSocket connections or polling for real-time content updates.

7. **Caching**: Implement appropriate caching strategies for better performance.

## Database Schema Reference

The API uses Supabase with the following main tables:
- `home_content`
- `spotify_playlists` 
- `storefront_products`
- `storefront_categories`
- `healing_products`
- `healing_page_content`
- `recipes`
- `recipes_page_content`
- `vlogs`
- `photo_albums`

All field names use snake_case convention as per the database schema.

✅ Fixed Naming Consistency
I completely removed all camelCase legacy methods instead of just renaming them:
Removed camelCase methods:
getHealingProducts() → removed (was wrapper around get_healing_products())
getAllProducts() → replaced with get_all_products() (direct DB access)
getAllVideos() → replaced with get_all_videos() (direct DB access)
createHealingProduct() → removed (was wrapper around create_healing_product())
updateHealingProduct() → removed (was wrapper around update_healing_product())
deleteHealingProduct() → removed (was wrapper around delete_healing_product())
createHealingCarouselVideo() → removed
updateHealingCarouselVideo() → removed
deleteHealingCarouselVideo() → removed
deleteProduct() → removed
Updated all call sites to use snake_case methods directly:
healingService.get_all_products() (with proper error handling)
healingService.get_all_videos() (with proper error handling)
healingService.create_healing_product() (with proper error handling)
healingService.update_healing_product() (with proper error handling)
healingService.delete_healing_product() (with proper error handling)
✅ Created Comprehensive API Documentation
Created API_DOCUMENTATION.md with:
Complete endpoint documentation for all APIs
Request/response schemas
Authentication requirements
Error handling patterns
Database schema reference
Integration notes for the sister Vite repo
✅ Benefits of This Approach
No duplicate methods - completely removed legacy camelCase
Consistent snake_case naming throughout the codebase
Better error handling - direct access to error responses from snake_case methods
Cleaner codebase - no more wrapper methods
Proper documentation for sister repo integration