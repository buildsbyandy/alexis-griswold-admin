import type { Database } from '@/types/supabase.generated'

type PlaylistRow = Database['public']['Tables']['spotify_playlists']['Row']
type PlaylistInsert = Database['public']['Tables']['spotify_playlists']['Insert']
type PlaylistUpdate = Database['public']['Tables']['spotify_playlists']['Update']

export interface SpotifyPlaylist {
  id: string;
  playlist_title: string;
  description: string;
  card_color: string;
  spotify_url: string;
  playlist_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

class PlaylistService {
  private readonly SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/316v3frkjuxqbtjv5vsld3c2vz44';

  async getAllPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const response = await fetch('/api/playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const data = await response.json();

      // Map database fields to service interface
      return (data.playlists as PlaylistRow[] || []).map((p: PlaylistRow) => ({
        id: p.id,
        playlist_title: p.playlist_title,
        description: p.description || '',
        card_color: p.card_color || '',
        spotify_url: p.spotify_url,
        playlist_order: p.playlist_order || 0,
        is_active: p.is_active || false,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }

  async getPlaylistById(id: string): Promise<SpotifyPlaylist | null> {
    try {
      const response = await fetch(`/api/playlists/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch playlist');
      }
      const data = await response.json();
      const p = data.playlist as PlaylistRow;

      return {
        id: p.id,
        playlist_title: p.playlist_title,
        description: p.description || '',
        card_color: p.card_color || '',
        spotify_url: p.spotify_url,
        playlist_order: p.playlist_order || 0,
        is_active: p.is_active || false,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at)
      };
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }

  async getDisplayPlaylists(limit = 3): Promise<SpotifyPlaylist[]> {
    const playlists = await this.getAllPlaylists();
    return playlists
      .filter(p => p.is_active)
      .sort((a, b) => a.playlist_order - b.playlist_order)
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

      // Map interface to database fields
      const playlistData: PlaylistInsert = {
        playlist_title: input.playlist_title,
        description: input.description || null,
        card_color: input.card_color || null,
        spotify_url: input.spotify_url,
        playlist_order: input.playlist_order,
        is_active: input.is_active
      };

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist_title: input.playlist_title,
          description: input.description,
          card_color: input.card_color,
          spotify_url: input.spotify_url,
          playlist_order: input.playlist_order,
          is_active: input.is_active
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create playlist');
      }
      return true;
    } catch (error) {
      console.error('Error adding playlist:', error);
      return false;
    }
  }

  async updatePlaylist(id: string, input: Partial<SpotifyPlaylist>): Promise<boolean> {
    try {
      // Map interface to database fields for API call
      const updatePayload: any = {};
      if (input.playlist_title !== undefined) updatePayload.playlist_title = input.playlist_title;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.card_color !== undefined) updatePayload.card_color = input.card_color;
      if (input.spotify_url !== undefined) updatePayload.spotify_url = input.spotify_url;
      if (input.playlist_order !== undefined) updatePayload.playlist_order = input.playlist_order;
      if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

      const response = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update playlist');
      }
      return true;
    } catch (error) {
      console.error('Error updating playlist:', error);
      return false;
    }
  }

  async deletePlaylist(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete playlist');
      }
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
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