import type { Database } from '@/types/supabase.generated'

type AlbumRow = Database['public']['Tables']['photo_albums']['Row']
type AlbumInsert = Database['public']['Tables']['photo_albums']['Insert']
type AlbumUpdate = Database['public']['Tables']['photo_albums']['Update']
type PhotoRow = Database['public']['Tables']['album_photos']['Row']

export interface PhotoAlbum {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  photos: Photo[];
  date: string;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
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
      return (data.albums as AlbumRow[] || []).map((album: any) => ({
        id: album.id,
        title: album.album_title || '',
        description: album.album_description || '',
        coverImage: album.cover_image_path || '',
        category: 'Lifestyle', // Default category since it's not in current DB schema
        photos: (album.photos || []).map((photo: PhotoRow) => ({
          id: photo.id,
          src: photo.image_path,
          alt: album.album_title, // Use album title as default alt
          caption: photo.photo_caption || '',
          order: photo.photo_order || 0
        })),
        date: album.album_date || '',
        isFeatured: album.is_visible || false,
        order: album.album_order || 0,
        createdAt: new Date(album.created_at),
        updatedAt: new Date(album.updated_at)
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
      const album = data.album as any;

      return {
        id: album.id,
        title: album.album_title || '',
        description: album.album_description || '',
        coverImage: album.cover_image_path || '',
        category: 'Lifestyle', // Default category
        photos: (album.photos || []).map((photo: PhotoRow) => ({
          id: photo.id,
          src: photo.image_path,
          alt: album.album_title,
          caption: photo.photo_caption || '',
          order: photo.photo_order || 0
        })),
        date: album.album_date || '',
        isFeatured: album.is_visible || false,
        order: album.album_order || 0,
        createdAt: new Date(album.created_at),
        updatedAt: new Date(album.updated_at)
      };
    } catch (error) {
      console.error('Error fetching album:', error);
      return null;
    }
  }

  async getDisplayAlbums(limit = 6): Promise<PhotoAlbum[]> {
    const albums = await this.getAllAlbums();
    return albums.sort((a, b) => a.order - b.order).slice(0, limit);
  }

  async addAlbum(input: Omit<PhotoAlbum, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      // Validate required fields
      if (!input.title.trim()) {
        throw new Error('Album title is required');
      }
      if (!input.coverImage.trim()) {
        throw new Error('Cover image is required');
      }
      if (!input.date) {
        throw new Error('Album date is required');
      }

      // Map interface to API payload with snake_case fields
      const albumPayload = {
        album_title: input.title,
        album_category: input.category || null,
        album_date: input.date,
        album_order: input.order || 0,
        album_description: input.description || null,
        is_featured: input.isFeatured || false,
        cover_image_path: input.coverImage,
        photos: input.photos.map((photo, index) => ({
          photo_url: photo.src,
          caption: photo.caption || null,
          photo_order: photo.order || index + 1
        }))
      };

      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create album');
      }
      return true;
    } catch (error) {
      console.error('Error adding album:', error);
      return false;
    }
  }

  async updateAlbum(id: string, input: Partial<PhotoAlbum>): Promise<boolean> {
    try {
      // Map interface to API payload with snake_case fields
      const updatePayload: any = {};
      if (input.title !== undefined) updatePayload.album_title = input.title;
      if (input.description !== undefined) updatePayload.album_description = input.description;
      if (input.date !== undefined) updatePayload.album_date = input.date;
      if (input.coverImage !== undefined) updatePayload.cover_image_path = input.coverImage;
      if (input.order !== undefined) updatePayload.album_order = input.order;
      if (input.isFeatured !== undefined) updatePayload.is_featured = input.isFeatured;
      if (input.category !== undefined) updatePayload.album_category = input.category;

      if (input.photos !== undefined) {
        updatePayload.photos = input.photos.map((photo, index) => ({
          photo_url: photo.src,
          caption: photo.caption || null,
          photo_order: photo.order || index + 1
        }));
      }

      const response = await fetch(`/api/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update album');
      }
      return true;
    } catch (error) {
      console.error('Error updating album:', error);
      return false;
    }
  }

  async deleteAlbum(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete album');
      }
      return true;
    } catch (error) {
      console.error('Error deleting album:', error);
      return false;
    }
  }

  // Helper methods for photo management
  async addPhotoToAlbum(albumId: string, photo: Omit<Photo, 'id'>): Promise<boolean> {
    try {
      const album = await this.getAlbumById(albumId);
      if (!album) return false;

      const updatedPhotos = [...album.photos, { ...photo, id: Date.now().toString() }];
      return this.updateAlbum(albumId, { photos: updatedPhotos });
    } catch {
      return false;
    }
  }

  async removePhotoFromAlbum(albumId: string, photoId: string): Promise<boolean> {
    try {
      const album = await this.getAlbumById(albumId);
      if (!album) return false;

      const updatedPhotos = album.photos.filter(p => p.id !== photoId);
      return this.updateAlbum(albumId, { photos: updatedPhotos });
    } catch {
      return false;
    }
  }

  // Statistics and utility methods
  async getStats() {
    const albums = await this.getAllAlbums();
    return {
      totalAlbums: albums.length,
      featuredAlbums: albums.filter(a => a.isFeatured).length,
      totalPhotos: albums.reduce((sum, album) => sum + album.photos.length, 0),
      categories: albums.reduce((counts, album) => {
        counts[album.category] = (counts[album.category] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };
  }

  // Export functionality
  async exportData(): Promise<string> {
    const albums = await this.getAllAlbums();
    return JSON.stringify({ albums }, null, 2);
  }
}

export const albumService = new AlbumService();
export default albumService;