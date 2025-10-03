import type { Database } from '@/types/supabase.generated'
import {
  findCarouselByPageSlug,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
  listViewItems,
  type ServiceResult
} from './carouselService'

type PlaylistRow = Database['public']['Tables']['spotify_playlists']['Row']
type PlaylistInsert = Database['public']['Tables']['spotify_playlists']['Insert']
type PlaylistUpdate = Database['public']['Tables']['spotify_playlists']['Update']

export interface SpotifyPlaylist {
  id: string;
  playlist_title: string;
  description: string;
  card_color: string;
  thumbnail_path?: string;
  use_color_overlay: boolean;
  spotify_url: string;
  order_index: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Internal type for compatibility with legacy database structure
interface PlaylistData {
  playlist_id: string;
  carousel_item_id: string;
  playlist_title: string;
  description: string;
  card_color: string;
  spotify_url: string;
  order_index: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

class PlaylistService {
  private readonly SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/316v3frkjuxqbtjv5vsld3c2vz44';
  private readonly CAROUSEL_SLUG = 'vlogs-spotify-playlists';

  async getAllPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      // Fetch playlists through the carousel system
      const viewResult = await listViewItems('vlogs', this.CAROUSEL_SLUG);
      if (viewResult.error) {
        console.error('Error fetching playlist carousel items:', viewResult.error);
        return [];
      }

      const carouselItems = viewResult.data || [];
      console.log('[DEBUG] getAllPlaylists carouselItems:', carouselItems);

     // Get playlist metadata for carousel items that have ref_ids (playlist IDs)
    const playlistIds = carouselItems
      .filter(item => item.kind === 'playlist' && item.ref_id)
      .map(item => item.ref_id)
      .filter(Boolean) as string[];

    console.log('[DEBUG] getAllPlaylists carouselItems with playlist kind:', carouselItems.filter(item => item.kind === 'playlist'));
    console.log('[DEBUG] getAllPlaylists playlistIds:', playlistIds);

      if (playlistIds.length === 0) {
        console.log('[DEBUG] getAllPlaylists no playlist IDs found');
        return [];
      }

      // Fetch playlist metadata from spotify_playlists table
      const response = await fetch(`/api/playlists/metadata?ids=${playlistIds.join(',')}`);
      if (!response.ok) {
        console.error('Failed to fetch playlist metadata');
        return [];
      }

      const { playlists } = await response.json();
      const playlistMap = new Map<string, PlaylistRow>(playlists.map((p: PlaylistRow) => [p.id, p]));

      // Combine carousel items with playlist metadata
      return carouselItems
        .filter(item => item.kind === 'playlist')
        .map(item => {
          if (!item.ref_id) {
            console.log('[DEBUG] Carousel item missing ref_id:', item);
            return null;
          }
          const playlist = playlistMap.get(item.ref_id);
          if (!playlist) {
            console.log('[DEBUG] No playlist found for ref_id:', item.ref_id);
            return null;
          }

          return {
            id: playlist.id,
            playlist_title: playlist.playlist_title,
            description: playlist.description || '',
            card_color: playlist.card_color || '',
            thumbnail_path: playlist.thumbnail_path || undefined,
            use_color_overlay: playlist.use_color_overlay ?? false,
            spotify_url: playlist.spotify_url,
            order_index: item.order_index || 0,
            is_active: item.is_active || false,
            created_at: new Date(playlist.created_at),
            updated_at: new Date(playlist.updated_at)
          };
        })
        .filter((playlist): playlist is SpotifyPlaylist => playlist !== null)
        .sort((a, b) => a.order_index - b.order_index);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }

  async getPlaylistById(id: string): Promise<SpotifyPlaylist | null> {
    try {
      // Get all playlists and find the one with matching id
      // This ensures we get the carousel order information
      const allPlaylists = await this.getAllPlaylists();
      return allPlaylists.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }

  async getDisplayPlaylists(limit = 3): Promise<SpotifyPlaylist[]> {
    const playlists = await this.getAllPlaylists();
    return playlists
      .filter(p => p.is_active)
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, limit);
  }

  async addPlaylist(input: Omit<SpotifyPlaylist, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      // Validate required fields
      if (!input.playlist_title.trim()) {
        throw new Error('Playlist name is required');
      }
      if (!input.spotify_url.trim()) {
        throw new Error('Spotify URL is required');
      }

      // Auto-increment order_index if not provided or is 0
      let orderIndex = input.order_index;
      if (orderIndex === undefined || orderIndex === 0) {
        const allPlaylists = await this.getAllPlaylists();
        const maxOrder = allPlaylists.reduce((max, p) => Math.max(max, p.order_index), -1);
        orderIndex = maxOrder + 1;
        console.log(`[DEBUG] Auto-assigned order_index: ${orderIndex}`);
      }

      // Ensure the vlogs-spotify-playlists carousel exists
      const carouselResult = await findCarouselByPageSlug('vlogs', this.CAROUSEL_SLUG);
      if (carouselResult.error) {
        throw new Error('Failed to find playlist carousel: ' + carouselResult.error);
      }
      if (!carouselResult.data) {
        throw new Error('Playlist carousel not found. Please ensure vlogs-spotify-playlists carousel exists.');
      }

      // First, create the playlist record in spotify_playlists table
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist_title: input.playlist_title,
          description: input.description,
          card_color: input.card_color,
          thumbnail_path: input.thumbnail_path,
          use_color_overlay: input.use_color_overlay,
          spotify_url: input.spotify_url,
          is_active: input.is_active
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create playlist');
      }

      const { playlist } = await response.json();

      // Then, create a carousel item that references this playlist
      const carouselItemResult = await createCarouselItem({
        carousel_id: carouselResult.data.id,
        kind: 'playlist',
        ref_id: playlist.id,  // Link to the playlist record
        caption: input.playlist_title,
        order_index: orderIndex,  // Use the auto-incremented order
        is_active: input.is_active,
        image_path: input.thumbnail_path || null,  // Store thumbnail in carousel for universal compatibility
      });

      if (carouselItemResult.error) {
        // If carousel item creation fails, we should ideally clean up the playlist record
        // For now, just log the error
        console.error('Failed to create carousel item for playlist:', carouselItemResult.error);
        throw new Error('Failed to create playlist carousel item: ' + carouselItemResult.error);
      }

      return true;
    } catch (error) {
      console.error('Error adding playlist:', error);
      return false;
    }
  }

  async updatePlaylist(id: string, input: Partial<SpotifyPlaylist>): Promise<boolean> {
    try {
      // First, update the playlist metadata if needed
      const metadataFields = ['playlist_title', 'description', 'card_color', 'thumbnail_path', 'use_color_overlay', 'spotify_url', 'is_active'];
      const hasMetadataUpdates = Object.keys(input).some(key => metadataFields.includes(key));

      if (hasMetadataUpdates) {
        const updatePayload: any = {};
        if (input.playlist_title !== undefined) updatePayload.playlist_title = input.playlist_title;
        if (input.description !== undefined) updatePayload.description = input.description;
        if (input.card_color !== undefined) updatePayload.card_color = input.card_color;
        if (input.thumbnail_path !== undefined) updatePayload.thumbnail_path = input.thumbnail_path;
        if (input.use_color_overlay !== undefined) updatePayload.use_color_overlay = input.use_color_overlay;
        if (input.spotify_url !== undefined) updatePayload.spotify_url = input.spotify_url;
        if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

        const response = await fetch(`/api/playlists/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update playlist metadata');
        }
      }

      // Then, update the carousel item if needed (order, active status, or thumbnail)
      if (input.order_index !== undefined || input.is_active !== undefined || input.thumbnail_path !== undefined) {
        // First, find the carousel item for this playlist
        const viewResult = await listViewItems('vlogs', this.CAROUSEL_SLUG);
        if (viewResult.error) {
          throw new Error('Failed to fetch carousel items: ' + viewResult.error);
        }

        const carouselItem = viewResult.data?.find(item => item.ref_id === id);
        if (!carouselItem || !carouselItem.carousel_item_id) {
          throw new Error('Carousel item not found for playlist');
        }

        // Update the carousel item
        const carouselUpdate: any = {};
        if (input.order_index !== undefined) carouselUpdate.order_index = input.order_index;
        if (input.is_active !== undefined) carouselUpdate.is_active = input.is_active;
        if (input.thumbnail_path !== undefined) carouselUpdate.image_path = input.thumbnail_path;

        const carouselUpdateResult = await updateCarouselItem(carouselItem.carousel_item_id, carouselUpdate);
        if (carouselUpdateResult.error) {
          throw new Error('Failed to update carousel item: ' + carouselUpdateResult.error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating playlist:', error);
      return false;
    }
  }

  async deletePlaylist(id: string): Promise<boolean> {
    try {
      // Get the playlist being deleted to know its order_index
      const allPlaylists = await this.getAllPlaylists();
      const deletedPlaylist = allPlaylists.find(p => p.id === id);

      // First, find and delete the carousel item
      const viewResult = await listViewItems('vlogs', this.CAROUSEL_SLUG);
      if (viewResult.error) {
        console.error('Failed to fetch carousel items for deletion:', viewResult.error);
      } else {
        const carouselItem = viewResult.data?.find(item => item.ref_id === id);
        if (carouselItem && carouselItem.carousel_item_id) {
          const deleteResult = await deleteCarouselItem(carouselItem.carousel_item_id);
          if (deleteResult.error) {
            console.error('Failed to delete carousel item:', deleteResult.error);
            // Continue with playlist deletion even if carousel item deletion fails
          }
        }
      }

      // Then delete the playlist record
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete playlist');
      }

      // Reorder remaining playlists to fill the gap
      if (deletedPlaylist) {
        await this.reorderAfterDeletion(deletedPlaylist.order_index, allPlaylists);
      }

      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  /**
   * Reorder playlists after deletion to close gaps in order_index
   */
  private async reorderAfterDeletion(deletedIndex: number, allPlaylists: SpotifyPlaylist[]): Promise<void> {
    try {
      // Find playlists that come after the deleted one
      const playlistsToUpdate = allPlaylists.filter(p => p.order_index > deletedIndex);

      // Update each playlist's order_index by decrementing it
      const updatePromises = playlistsToUpdate.map(playlist =>
        this.updatePlaylist(playlist.id, {
          order_index: playlist.order_index - 1
        })
      );

      await Promise.all(updatePromises);
      console.log(`[DEBUG] Reordered ${playlistsToUpdate.length} playlists after deletion`);
    } catch (error) {
      console.error('Error reordering playlists after deletion:', error);
      // Don't throw - deletion was successful, reordering is a nice-to-have
    }
  }

  getSpotifyProfileUrl(): string {
    return this.SPOTIFY_PROFILE_URL;
  }

  // Legacy method names for backward compatibility
  async getActivePlaylists(limit = 3): Promise<SpotifyPlaylist[]> {
    return this.getDisplayPlaylists(limit);
  }
}

export const playlistService = new PlaylistService();
export default playlistService;