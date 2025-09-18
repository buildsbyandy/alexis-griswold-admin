import type { Database } from '@/types/supabase.generated'

type VlogRow = Database['public']['Tables']['vlogs']['Row']
type VlogInsert = Database['public']['Tables']['vlogs']['Insert']
type VlogUpdate = Database['public']['Tables']['vlogs']['Update']

export type VlogCarouselType = 'main-channel' | 'ag-vlogs';

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
  is_featured: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Photo { id: string; src: string; alt: string; caption?: string; order: number; }


class VlogService {
  private readonly VLOGS_KEY = 'admin_vlogs';
  private readonly YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@alexisgriswold';
  private readonly INSTAGRAM_URL = 'https://www.instagram.com/lexigriswold';
  private readonly SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/316v3frkjuxqbtjv5vsld3c2vz44';

  // Carousel configuration
  readonly CAROUSELS = {
    'main-channel': { 
      name: 'MAIN CHANNEL', 
      description: 'Latest videos from YouTube channel',
      displayName: 'Main Channel' 
    },
    'ag-vlogs': { 
      name: 'AG VLOGS', 
      description: 'Personal vlogs and behind-the-scenes content',
      displayName: 'AG Vlogs' 
    }
  } as const;

  async getAllVlogs(): Promise<VlogVideo[]> {
    try {
      const response = await fetch('/api/vlogs');
      if (!response.ok) throw new Error('Failed to fetch vlogs');
      const data = await response.json();
      // Map database fields to service interface
      return (data.vlogs as VlogRow[] || []).map((v: VlogRow) => ({
        id: v.id,
        title: v.title || '',
        description: v.description || '',
        youtubeUrl: v.youtube_url || '',
        youtubeId: this.extractYouTubeId(v.youtube_url || ''),
        thumbnailUrl: v.thumbnail_url || '',
        publishedAt: v.published_at || '',
        duration: v.duration || '',
        carousel: (v.carousel || 'main-channel') as VlogCarouselType,
        isFeatured: v.is_featured || false,
        order: v.display_order || 0,
        createdAt: new Date(v.created_at),
        updatedAt: new Date(v.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching vlogs:', error);
      // Fallback to localStorage for development
      try { const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.VLOGS_KEY) : null; return stored ? JSON.parse(stored) : []; } catch { return []; }
    }
  }

  async addVlog(input: Omit<VlogVideo, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      // Validate and process YouTube URL
      if (!this.validateYouTubeUrl(input.youtubeUrl)) {
        throw new Error('Invalid YouTube URL');
      }

      const youtubeId = this.extractYouTubeId(input.youtubeUrl);
      if (!youtubeId) {
        throw new Error('Could not extract YouTube ID from URL');
      }

      // Auto-generate thumbnail if not provided
      const thumbnailUrl = input.thumbnailUrl || this.generateThumbnailUrl(youtubeId);

      // Map interface to database fields
      const vlogData: VlogInsert = {
        title: input.title,
        description: input.description,
        youtube_url: input.youtubeUrl,
        thumbnail_url: thumbnailUrl,
        published_at: input.publishedAt,
        duration: input.duration,
        carousel: input.carousel,
        is_featured: input.isFeatured,
        display_order: input.order
      };

      const response = await fetch('/api/vlogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vlogData)
      });

      if (!response.ok) throw new Error('Failed to create vlog');
      return true;
    } catch (error) {
      console.error('Error adding vlog:', error);
      return false;
    }
  }

  async updateVlog(id: string, input: Partial<VlogVideo>): Promise<boolean> {
    try {
      // Map interface to database fields
      const vlogData: VlogUpdate = {};
      if (input.title !== undefined) vlogData.title = input.title;
      if (input.description !== undefined) vlogData.description = input.description;
      if (input.thumbnailUrl !== undefined) vlogData.thumbnail_url = input.thumbnailUrl;
      if (input.publishedAt !== undefined) vlogData.published_at = input.publishedAt;
      if (input.duration !== undefined) vlogData.duration = input.duration;
      if (input.carousel !== undefined) vlogData.carousel = input.carousel;
      if (input.isFeatured !== undefined) vlogData.is_featured = input.isFeatured;
      if (input.order !== undefined) vlogData.display_order = input.order;

      // Handle YouTube URL updates
      if (input.youtubeUrl !== undefined) {
        if (!this.validateYouTubeUrl(input.youtubeUrl)) {
          throw new Error('Invalid YouTube URL');
        }
        const youtubeId = this.extractYouTubeId(input.youtubeUrl);
        if (!youtubeId) {
          throw new Error('Could not extract YouTube ID from URL');
        }
        vlogData.youtube_url = input.youtubeUrl;
        // Auto-update thumbnail if not explicitly provided
        if (input.thumbnailUrl === undefined) {
          vlogData.thumbnail_url = this.generateThumbnailUrl(youtubeId);
        }
      }

      const response = await fetch(`/api/vlogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vlogData)
      });

      if (!response.ok) throw new Error('Failed to update vlog');
      return true;
    } catch (error) {
      console.error('Error updating vlog:', error);
      return false;
    }
  }

  async deleteVlog(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/vlogs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete vlog');
      return true;
    } catch (error) {
      console.error('Error deleting vlog:', error);
      return false;
    }
  }
  async getFeaturedVlog(): Promise<VlogVideo | null> { const v = await this.getAllVlogs(); return v.find(x => x.isFeatured) || v[0] || null; }
  async getMainChannelVlogs(limit = 6): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); return v.filter(v => v.carousel === 'main-channel' && !v.isFeatured).sort((a,b)=>a.order-b.order).slice(0, limit); }
  async getAGVlogs(limit = 6): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); return v.filter(v => v.carousel === 'ag-vlogs' && !v.isFeatured).sort((a,b)=>a.order-b.order).slice(0, limit); }
  async getVlogsByCarousel(carousel: VlogCarouselType, limit?: number): Promise<VlogVideo[]> { const v = await this.getAllVlogs(); const filtered = v.filter(v => v.carousel === carousel && !v.isFeatured).sort((a,b)=>a.order-b.order); return limit ? filtered.slice(0, limit) : filtered; }
  
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
  async getStats() { const v=await this.getAllVlogs(); return { totalVlogs: v.length, featuredVlogs: v.filter(x=>x.isFeatured).length } }

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
}

export const vlogService = new VlogService();
export default vlogService;

