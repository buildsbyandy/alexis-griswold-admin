# Admin Dashboard Rebuild Notes

## Current State Analysis
- **Dev server**: Running on http://localhost:3001 (port 3000 in use)
- **Current admin**: Basic tabs with placeholder functionality in `pages/index.tsx`
- **Screenshots**: Organized in `screenshots/old-live/` with comprehensive coverage

## Key Findings from Old Dashboard Screenshots

### Features to Rebuild (in priority order):

1. **Home Page Management** (`OldDashboard-HomePage.png`)
   - Video background management (upload/preview)
   - Fallback image settings
   - Mobile optimization controls
   - Auto fallback settings
   - Export settings functionality
   - Rich media settings with preview cards

2. **Vlogs Section** (`OldDashboard-VlogsPage-*.png`)
   - Stats dashboard: "6 Total Videos, 6 Photo Albums, 3 Spotify Playlists, 1 Featured Video"
   - Quick action buttons: "Quick Add Vlog", "Quick Add Album"
   - Tabbed interface: Hero Section, Video Carousels, Photo Gallery, Spotify Section
   - Hero section content management with rich text
   - Featured video management with thumbnails
   - Carousel editing with visual controls

3. **Recipes Management** (`OldDashboard-RecipePage.png`)
   - Stats: "0 Total Recipes, 0 Beginner Recipes, 0 Recipe of Week, 0 Active Folders"
   - Action buttons: Add New Recipe, Export, Import, Restore Sample
   - Search functionality with folder filtering
   - Recipe card previews (currently empty but structure exists)

4. **Healing Section** (`OldDashboard-HealingPage-*.png`)
   - Hero section management
   - Carousel headers editing
   - Products & Supplements management
   - Rich content editing forms

5. **Storefront** (`OldDashboard-StorefrontPage.png`)
   - Product management interface
   - Category organization
   - Visual product cards

## Technical Observations
- **UI Framework**: Clean, professional design with beige/brown color scheme
- **Layout**: Tabbed interface with rich content management
- **Data Integration**: Connected to live data sources (Supabase)
- **Media Management**: Visual previews, upload functionality
- **Export/Import**: Full data management capabilities

## Current Codebase Structure
- `components/admin/AdminLayout.tsx`: Modern layout with sidebar navigation
- `pages/index.tsx`: Current admin with basic tab structure
- Services connected: `recipeService`, `vlogService`, `storefrontService`
- Supabase integration: Already configured in `lib/supabase/`

## Next Steps
1. Copy old admin.tsx as reference file
2. Start with Home page management (most visual impact)
3. Move to Vlogs section (richest functionality)
4. Gradually rebuild each section using old patterns
5. Ensure Supabase integration works with each rebuilt feature

## Key Design Patterns to Maintain
- Stats cards with large numbers and descriptions
- Quick action buttons for common tasks
- Tabbed sub-navigation within sections
- Visual preview cards for media content
- Inline editing with save/cancel functionality
- Export/Import capabilities
- Rich text editing for content management

## Current Admin Layout Navigation
Already implemented in AdminLayout.tsx:
- Dashboard, Vlogs, Recipes, Products, Playlists, Albums, Settings