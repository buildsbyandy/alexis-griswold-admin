import type { Database } from '@/types/supabase.generated'
import { getMediaUrl } from '@/lib/utils/storageHelpers'
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
} from './carouselService'

type AlbumRow = Database['public']['Tables']['photo_albums']['Row']
type AlbumInsert = Database['public']['Tables']['photo_albums']['Insert']
type AlbumUpdate = Database['public']['Tables']['photo_albums']['Update']
type PhotoRow = Database['public']['Tables']['album_photos']['Row']

export interface PhotoAlbum {
  id: string;
  album_title: string;
  album_description: string | null;
  // page_type removed - now managed by carousel_page in unified system
  cover_image_path: string | null;
  album_date: string | null;
  album_order: number | null;
  is_visible: boolean | null;
  created_at: Date;
  updated_at: Date;
}

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  order: number;
}

class AlbumService {
  async getAllAlbums(): Promise<PhotoAlbum[]> {
    try {
      const response = await fetch('/api/albums');
      if (!response.ok) throw new Error('Failed to fetch albums');
      const data = await response.json();

      // Map database fields to service interface
      return (data.albums as AlbumRow[] || []).map((album: AlbumRow) => ({
        id: album.id,
        album_title: album.album_title,
        album_description: album.album_description,
        // page_type field removed - now managed by carousel_page in unified system
        cover_image_path: album.cover_image_path,
        album_date: album.album_date,
        album_order: album.album_order,
        is_visible: album.is_visible,
        created_at: new Date(album.created_at),
        updated_at: new Date(album.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  async getAlbumById(id: string): Promise<PhotoAlbum | null> {
    try {
      const response = await fetch(`/api/albums/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch album');
      }
      const data = await response.json();
      const album = data.album as AlbumRow;

      return {
        id: album.id,
        album_title: album.album_title,
        album_description: album.album_description,
        // page_type field removed - now managed by carousel_page in unified system
        cover_image_path: album.cover_image_path,
        album_date: album.album_date,
        album_order: album.album_order,
        is_visible: album.is_visible,
        created_at: new Date(album.created_at),
        updated_at: new Date(album.updated_at)
      };
    } catch (error) {
      console.error('Error fetching album:', error);
      return null;
    }
  }

  async getDisplayAlbums(limit = 6): Promise<PhotoAlbum[]> {
    const albums = await this.getAllAlbums();
    return albums
      .filter(a => a.is_visible)
      .sort((a, b) => (a.album_order || 0) - (b.album_order || 0))
      .slice(0, limit);
  }

  async addAlbum(input: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at'>, carouselId: string, orderIndex = 0): Promise<boolean> {
    try {
      // Validate required fields
      if (!input.album_title?.trim()) {
        throw new Error('Album title is required');
      }
      if (!input.cover_image_path?.trim()) {
        throw new Error('Cover image is required');
      }

      // Map interface to API payload with snake_case fields matching database schema
      const albumPayload: AlbumInsert = {
        album_title: input.album_title,
        album_date: input.album_date,
        album_order: input.album_order || 0,
        album_description: input.album_description,
        is_visible: input.is_visible || false,
        cover_image_path: input.cover_image_path,
        // page_type field removed - now managed by carousel_page in unified system
      };

      // First create the album record
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create album');
      }

      const result = await response.json();
      const createdAlbum = result.album;

      // Now create carousel item linking the new album
      const carouselItemResult = await createCarouselItem({
        carousel_id: carouselId,
        kind: 'album',
        album_id: createdAlbum.id,
        caption: input.album_title,
        order_index: orderIndex,
        is_active: input.is_visible || false,
      });

      if (carouselItemResult.error) {
        console.warn('Album created but failed to add to carousel:', carouselItemResult.error);
        // Don't fail the whole operation since the album was created
      }

      return true;
    } catch (error) {
      console.error('Error adding album:', error);
      return false;
    }
  }

  async updateAlbum(id: string, input: Partial<PhotoAlbum>): Promise<boolean> {
    try {
      // Map interface to API payload with snake_case fields matching database schema
      const updatePayload: Partial<AlbumUpdate> = {};
      if (input.album_title !== undefined) updatePayload.album_title = input.album_title;
      if (input.album_description !== undefined) updatePayload.album_description = input.album_description;
      if (input.album_date !== undefined) updatePayload.album_date = input.album_date;
      if (input.cover_image_path !== undefined) updatePayload.cover_image_path = input.cover_image_path;
      if (input.album_order !== undefined) updatePayload.album_order = input.album_order;
      if (input.is_visible !== undefined) updatePayload.is_visible = input.is_visible;
      // if (input.page_type !== undefined) updatePayload.page_type = input.page_type; // Legacy field removed

      const response = await fetch(`/api/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update album');
      }

      // Update any associated carousel items
      // Note: For now we'll just update the caption if title changed
      // A more robust implementation would find carousel items by album_id
      // and update their properties accordingly

      return true;
    } catch (error) {
      console.error('Error updating album:', error);
      return false;
    }
  }

  async deleteAlbum(id: string): Promise<boolean> {
    try {
      // First, find and delete any carousel items that reference this album
      // Note: This is a simplified approach. A more robust implementation
      // would use the API to find carousel items by album_id

      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete album');
      }

      // Note: The cascade delete should handle carousel_items automatically
      // via database constraints, but we could add explicit cleanup here

      return true;
    } catch (error) {
      console.error('Error deleting album:', error);
      return false;
    }
  }

  // New method to delete album from carousel without deleting the album itself
  async removeAlbumFromCarousel(albumId: string, carouselId: string): Promise<boolean> {
    try {
      const items = await getCarouselItems(carouselId);
      if (items.error || !items.data) {
        throw new Error('Failed to get carousel items');
      }

      const albumItem = items.data.find(item => item.album_id === albumId);
      if (albumItem) {
        const result = await deleteCarouselItem(albumItem.id);
        return !result.error;
      }

      return true; // Album wasn't in carousel anyway
    } catch (error) {
      console.error('Error removing album from carousel:', error);
      return false;
    }
  }

  // Statistics and utility methods
  async getStats() {
    const albums = await this.getAllAlbums();
    return {
      totalAlbums: albums.length,
      visibleAlbums: albums.filter(a => a.is_visible).length,
      totalPhotos: 0, // This would need to be computed from album_photos table
    };
  }

  // Export functionality
  async exportData(): Promise<string> {
    const albums = await this.getAllAlbums();
    return JSON.stringify({ albums }, null, 2);
  }

  /**
   * Gets the appropriate media URL for album images (always public)
   */
  async getAlbumImageUrl(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;
    // Albums are always public, so use direct URLs
    return await getMediaUrl(imageUrl, false);
  }

  /**
   * Gets all image URLs for an album with proper bucket handling
   */
  async getAlbumImages(album: PhotoAlbum): Promise<{ coverImage: string | null }> {
    const coverImage = album.cover_image_path
      ? await this.getAlbumImageUrl(album.cover_image_path)
      : null;

    return { coverImage };
  }
}

export const albumService = new AlbumService();
export default albumService;