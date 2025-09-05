# API Endpoints Required for Admin Dashboard

## 🚀 **New Endpoints Required**

### **1. Healing Carousel Management**
```
GET    /api/healing/carousels
POST   /api/healing/carousel-videos
PUT    /api/healing/carousel-videos/:id
DELETE /api/healing/carousel-videos/:id
```

**GET /api/healing/carousels Response:**
```json
{
  "carousels": [
    {
      "id": "uuid",
      "carousel_number": 1,
      "header": "First Carousel Header",
      "subtitle": "First Carousel Subtitle", 
      "videos": [
        {
          "id": "uuid",
          "youtube_url": "https://youtube.com/watch?v=...",
          "video_title": "Video Title",
          "video_description": "Description",
          "video_order": 1,
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### **2. Vlogs API Updates**
The existing `/api/vlogs` endpoints need to handle the new database fields:

**Expected Request/Response format:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "thumbnail_url": "string",
  "youtube_url": "string",         // NEW FIELD
  "carousel": "main-channel|ag-vlogs", // NEW FIELD  
  "published_at": "string",
  "views": "string",
  "duration": "string",
  "is_featured": boolean,
  "display_order": number
}
```

## 🔄 **Existing Endpoints That Need Updates**

### **1. Recipes API**
Should handle the new `status` enum and `is_favorite` field:
```json
{
  "status": "draft|published|archived",  // UPDATED
  "is_favorite": boolean                  // NEW
}
```

### **2. Storefront API**  
Should handle new `price` and `is_favorite` fields:
```json
{
  "price": number,        // NEW
  "is_favorite": boolean  // NEW
}
```

### **3. Healing Products API**
Field mapping is correct, using `product_link` for Amazon URL.

## 🗃️ **Database Preparation**

**Before testing, run the migration script:**
```bash
psql -h your-host -d your-database -f migrations/001_add_missing_fields.sql
```

## 🎯 **Testing Priority**

1. **High Priority**: Run database migrations
2. **High Priority**: Test storefront functionality (most complex mapping)
3. **Medium Priority**: Test healing carousel system  
4. **Medium Priority**: Test vlogs with new fields
5. **Low Priority**: Test recipes with status enum

## 🚨 **Breaking Changes**

### **Recipe Interface Change**
**Before:**
```typescript
interface Recipe {
  isPublished: boolean;
}
```

**After:**
```typescript  
interface Recipe {
  status: 'draft' | 'published' | 'archived';
  isFavorite: boolean;
}
```

**Admin pages using recipes may need updates to handle the new status field instead of isPublished.**

## ✅ **Ready to Test**

The admin frontend services have been updated to:
- Use correct database property names
- Handle JSON ↔ string[] array conversions  
- Map between database enums and frontend interfaces
- Use the existing carousel system for healing videos

**Next step: Create/update the API endpoints listed above, then test the admin dashboard functionality.**