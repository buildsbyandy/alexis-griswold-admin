import type { Database } from '@/types/supabase.generated'
import { getThumbnailUrl, type ContentStatus } from '@/lib/utils/storageHelpers'
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
} from './carouselService'

type VlogRow = Database['public']['Tables']['vlogs']['Row']
type VlogInsert = Database['public']['Tables']['vlogs']['Insert']
type VlogUpdate = Database['public']['Tables']['vlogs']['Update']

export type VlogCarouselType = 'vlogs-main-channel' | 'vlogs-ag-vlogs';

export interface VlogVideo {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_id: string | null;
  thumbnail_url: string;
  published_at: string;
  duration: string;
  carousel: VlogCarouselType;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface Photo { id: string; src: string; alt: string; caption?: string; order: number; }

/**
 * Gets the appropriate base URL for API calls based on the current environment.
 * Same pattern as used in carouselService for consistency.
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return ''; // Client-side
  return process.env.NODE_ENV === 'production'
    ? 'https://admin.alexisgriswold.com'  // Production
    : 'http://localhost:3000';            // Development
}


class VlogService {
  private readonly VLOGS_KEY = 'admin_vlogs';
  private readonly YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@alexisgriswold';
  private readonly INSTAGRAM_URL = 'https://www.instagram.com/lexigriswold';
  private readonly SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/316v3frkjuxqbtjv5vsld3c2vz44';

  // Carousel configuration
  readonly CAROUSELS = {
    'vlogs-main-channel': { 
      name: 'MAIN CHANNEL', 
      description: 'Latest videos from YouTube channel',
      displayName: 'Main Channel' 
    },
    'vlogs-ag-vlogs': { 
      name: 'AG VLOGS', 
      description: 'Personal vlogs and behind-the-scenes content',
      displayName: 'AG Vlogs' 
    }
  } as const;

  async getAllVlogs(): Promise<VlogVideo[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/vlogs`;

      console.log(`[DEBUG] getAllVlogs fetching: ${url}`);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch vlogs');
      const data = await response.json();
      // Map database fields to service interface
      return (data.vlogs as VlogRow[] || []).map((v: VlogRow) => ({
        id: v.id,
        title: v.title || '',
        description: v.description || '',
        youtube_url: v.youtube_url || '',
        youtube_id: this.extractYouTubeId(v.youtube_url || ''),
        thumbnail_url: v.thumbnail_url || '',
        published_at: v.published_at || '',
        duration: v.duration || '',
        carousel: 'vlogs-main-channel' as VlogCarouselType, // Default carousel for backwards compatibility
        order_index: 0, // Order is now managed by carousel system
        created_at: new Date(v.created_at),
        updated_at: new Date(v.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching vlogs:', error);
      // Fallback to localStorage for development
      try { const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.VLOGS_KEY) : null; return stored ? JSON.parse(stored) : []; } catch { return []; }
    }
  }

  async addVlog(input: Omit<VlogVideo, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      // Validate and process YouTube URL
      if (!this.validateYouTubeUrl(input.youtube_url)) {
        throw new Error('Invalid YouTube URL');
      }

      const youtubeId = this.extractYouTubeId(input.youtube_url);
      if (!youtubeId) {
        throw new Error('Could not extract YouTube ID from URL');
      }

      // Auto-generate thumbnail if not provided
      const thumbnailUrl = input.thumbnail_url || this.generateThumbnailUrl(youtubeId);

      // First create the vlog record
      const vlogData: VlogInsert = {
        title: input.title,
        description: input.description,
        youtube_url: input.youtube_url,
        thumbnail_url: thumbnailUrl,
        published_at: input.published_at,
        duration: input.duration,
        // carousel, is_featured, display_order fields removed - now managed by carousel system
      };

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/vlogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vlogData)
      });

      if (!response.ok) throw new Error('Failed to create vlog');

      const result = await response.json();
      const createdVlog = result.vlog;

      // Always create carousel item for new vlogs
      {
        const carouselSlug = `vlogs-${input.carousel}`;
        let carousel = await findCarouselByPageSlug('vlogs', carouselSlug);

        if (!carousel.data) {
          const carouselName = input.carousel === 'vlogs-main-channel' ? 'Main Channel' : 'AG Vlogs';
          const created = await createCarousel({
            page: 'vlogs',
            slug: carouselSlug,
            title: carouselName,
            is_active: true
          });
          if (created.error) {
            console.warn('Failed to create carousel, continuing without carousel item');
            return true;
          }
          carousel = { data: created.data };
        }

        if (carousel.data) {
          await createCarouselItem({
            carousel_id: carousel.data.id,
            kind: 'video',
            youtube_id: youtubeId,
            caption: input.title,
            order_index: input.order_index,
            is_active: true,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding vlog:', error);
      return false;
    }
  }

  async updateVlog(id: string, input: Partial<VlogVideo>): Promise<boolean> {
    try {
      // Get current vlog to understand its state
      const baseUrl = getApiBaseUrl();
      const currentResponse = await fetch(`${baseUrl}/api/vlogs/${id}`);
      if (!currentResponse.ok) throw new Error('Failed to fetch current vlog');
      const currentData = await currentResponse.json();
      const currentVlog = currentData.vlog;

      // Map interface to database fields
      const vlogData: VlogUpdate = {};
      if (input.title !== undefined) vlogData.title = input.title;
      if (input.description !== undefined) vlogData.description = input.description;
      if (input.thumbnail_url !== undefined) vlogData.thumbnail_url = input.thumbnail_url;
      if (input.published_at !== undefined) vlogData.published_at = input.published_at;
      if (input.duration !== undefined) vlogData.duration = input.duration;
      // carousel field removed - now managed by carousel system
      // Note: is_featured and display_order are legacy fields - not updated via this interface

      // Handle YouTube URL updates
      let youtubeId = this.extractYouTubeId(currentVlog.youtube_url);
      if (input.youtube_url !== undefined) {
        if (!this.validateYouTubeUrl(input.youtube_url)) {
          throw new Error('Invalid YouTube URL');
        }
        youtubeId = this.extractYouTubeId(input.youtube_url);
        if (!youtubeId) {
          throw new Error('Could not extract YouTube ID from URL');
        }
        vlogData.youtube_url = input.youtube_url;
        // Auto-update thumbnail if not explicitly provided
        if (input.thumbnail_url === undefined) {
          vlogData.thumbnail_url = this.generateThumbnailUrl(youtubeId);
        }
      }

      // Update the vlog record
      const response = await fetch(`${baseUrl}/api/vlogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vlogData)
      });

      if (!response.ok) throw new Error('Failed to update vlog');

      // Note: Carousel item updates (order_index, carousel changes) should be handled
      // through the carousel management system, not through vlog updates

      return true;
    } catch (error) {
      console.error('Error updating vlog:', error);
      return false;
    }
  }

  async deleteVlog(id: string): Promise<boolean> {
    try {
      // First get the vlog to understand its carousel association
      const baseUrl = getApiBaseUrl();
      const currentResponse = await fetch(`${baseUrl}/api/vlogs/${id}`);
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        const currentVlog = currentData.vlog;

        // If it's not featured, remove from carousel first
        // Always remove from carousel when deleting vlogs
        {
          const carouselSlug = `vlogs-${currentVlog.carousel}`;
          const carouselResult = await findCarouselByPageSlug('vlogs', carouselSlug);
          if (carouselResult.data) {
            const items = await getCarouselItems(carouselResult.data.id);
            const item = items.data?.find(item => item.ref_id === id);
            if (item) {
              await deleteCarouselItem(item.id);
            }
          }
        }
      }

      // Now delete the vlog itself
      const response = await fetch(`${baseUrl}/api/vlogs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete vlog');
      return true;
    } catch (error) {
      console.error('Error deleting vlog:', error);
      return false;
    }
  }

  async getFeaturedVlog(): Promise<VlogVideo | null> {
    try {
      // Use carousel system to get the featured vlog
      const carousel = await findCarouselByPageSlug('vlogs', 'vlogs-featured');
      if (carousel.error || !carousel.data) {
        return null;
      }

      const items = await getCarouselItems(carousel.data.id);
      if (items.error || !items.data || items.data.length === 0) {
        return null;
      }

      // Get the first (and should be only) item from the featured carousel
      const featuredItem = items.data[0];
      if (!featuredItem.ref_id) {
        return null;
      }

      // Fetch the actual vlog data
      const allVlogs = await this.getAllVlogs();
      const featuredVlog = allVlogs.find(v => v.id === featuredItem.ref_id);
      return featuredVlog || null;
    } catch (error) {
      console.error('Error fetching featured vlog from carousel:', error);
      return null;
    }
  }

  async setFeaturedVlog(vlogId: string): Promise<boolean> {
    try {
      console.log(`[DEBUG] setFeaturedVlog called with vlogId: "${vlogId}"`);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/vlogs/featured`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vlogId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] setFeaturedVlog failed:', errorData.error);
        return false;
      }

      console.log(`[DEBUG] Successfully set featured vlog: ${vlogId}`);
      return true;
    } catch (error) {
      console.error('Error setting featured vlog:', error);
      return false;
    }
  }

  async removeFeaturedVlog(): Promise<boolean> {
    try {
      // Find the 'vlogs-featured' carousel
      const carousel = await findCarouselByPageSlug('vlogs', 'vlogs-featured');
      if (carousel.error || !carousel.data) {
        return true; // Already no featured vlog
      }

      // Delete all items from the featured carousel
      const currentItems = await getCarouselItems(carousel.data.id);
      if (currentItems.data && currentItems.data.length > 0) {
        for (const item of currentItems.data) {
          await deleteCarouselItem(item.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error removing featured vlog:', error);
      return false;
    }
  }

  async getMainChannelVlogs(limit = 6): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); return v.filter(v => v.carousel === 'vlogs-main-channel').sort((a,b)=>a.order_index-b.order_index).slice(0, limit); }
  async getAGVlogs(limit = 6): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); return v.filter(v => v.carousel === 'vlogs-ag-vlogs').sort((a,b)=>a.order_index-b.order_index).slice(0, limit); }
  async getVlogsByCarousel(carousel: VlogCarouselType, limit?: number): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); const filtered = v.filter(v => v.carousel === carousel).sort((a,b)=>a.order_index-b.order_index); return limit ? filtered.slice(0, limit) : filtered; }
  
  // Legacy method for backward compatibility
  async getDisplayVlogs(limit = 6): Promise<VlogVideo[]> { return this.getMainChannelVlogs(limit); }
  async getPersonalVlogs(): Promise<VlogVideo[]> { return this.getAGVlogs(); }
  getYouTubeChannelUrl(): string { return this.YOUTUBE_CHANNEL_URL; }
  getInstagramUrl(): string { return this.INSTAGRAM_URL; }
  getSpotifyProfileUrl(): string { return this.SPOTIFY_PROFILE_URL; }


  async exportData(): Promise<string> {
    const storedVlogs = typeof localStorage !== 'undefined' ? localStorage.getItem(this.VLOGS_KEY) : null;
    const vlogs = storedVlogs ? JSON.parse(storedVlogs) : this.getDefaultVlogs();
    return JSON.stringify({ vlogs }, null, 2);
  }
  importData(json: string): boolean { try { const d=JSON.parse(json); if(d.vlogs) this.saveVlogs(d.vlogs); return true;} catch {return false;} }
  async getStats() { const v=await this.getAllVlogs(); return { totalVlogs: v.length, featuredVlogs: 0 } } // Featured vlogs now managed by carousel system

  private saveVlogs(v: VlogVideo[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.VLOGS_KEY, JSON.stringify(v)); }

  private getDefaultVlogs(): VlogVideo[] { 
    // No default videos - all videos should be user-inputted through the admin dashboard
    return []; 
  }



  // YouTube utility methods
  extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  generateThumbnailUrl(youtubeId: string): string {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  validateYouTubeUrl(url: string): boolean {
    return this.extractYouTubeId(url) !== null;
  }

  formatYouTubeUrl(youtubeId: string): string {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  /**
   * Determines vlog status based on published_at field and show on website toggle
   */
  getVlogStatus(vlog: VlogVideo): ContentStatus {
    // If no published_at date, it's a draft
    if (!vlog.published_at) return 'draft';

    // If published_at is in the future, it's a draft
    const publishDate = new Date(vlog.published_at);
    if (publishDate > new Date()) return 'draft';

    // If it's featured or has order index, it's published (shown on website)
    if (vlog.order_index > 0) return 'published';

    // Default to draft for safety
    return 'draft';
  }

  /**
   * Gets the appropriate thumbnail URL with fallback logic
   */
  async getVlogThumbnailUrl(vlog: VlogVideo): Promise<string | null> {
    return await getThumbnailUrl(vlog.thumbnail_url, vlog.youtube_id);
  }
}

export const vlogService = new VlogService();
export default vlogService;

