export type VlogCarouselType = 'main-channel' | 'ag-vlogs';

export interface VlogVideo {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  carousel: VlogCarouselType;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoAlbum {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: 'Lifestyle' | 'Food' | 'Travel' | 'Wellness' | 'Fitness' | 'Home';
  photos: Photo[];
  date: string;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo { id: string; src: string; alt: string; caption?: string; order: number; }

export interface SpotifyPlaylist {
  id: string;
  name: string;
  mood: string;
  color: string;
  spotifyUrl: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class VlogService {
  private readonly VLOGS_KEY = 'admin_vlogs';
  private readonly ALBUMS_KEY = 'admin_albums';
  private readonly PLAYLISTS_KEY = 'admin_spotify_playlists';
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
      return (data.vlogs || []).map((v: any) => ({
        id: v.id,
        title: v.title,
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
      const vlogData = {
        title: input.title,
        description: input.description,
        youtube_url: input.youtubeUrl,
        youtube_id: youtubeId,
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
      const vlogData: any = {};
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
        vlogData.youtube_id = youtubeId;
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

  getAllPlaylists(): SpotifyPlaylist[] { 
    try { 
      const s = typeof localStorage !== 'undefined' ? localStorage.getItem(this.PLAYLISTS_KEY) : null; 
      return s ? JSON.parse(s) : []; 
    } catch { 
      return []; 
    } 
  }
  getDisplayPlaylists(limit=3): SpotifyPlaylist[] { return this.getAllPlaylists().filter(p=>p.isActive).sort((a,b)=>a.order-b.order).slice(0,limit); }
  addPlaylist(p: Omit<SpotifyPlaylist,'id'|'createdAt'|'updatedAt'>): boolean { try { const list=this.getAllPlaylists(); list.push({ ...p, id: Date.now().toString(), createdAt:new Date(), updatedAt:new Date() }); this.savePlaylists(list); return true;} catch {return false;} }
  updatePlaylist(id: string, u: Partial<SpotifyPlaylist>): boolean { try { const list=this.getAllPlaylists(); const i=list.findIndex(x=>x.id===id); if(i===-1) return false; list[i]={...list[i],...u,updatedAt:new Date()}; this.savePlaylists(list); return true;} catch {return false;} }
  deletePlaylist(id: string): boolean { try { const list=this.getAllPlaylists().filter(p=>p.id!==id); this.savePlaylists(list); return true;} catch {return false;} }

  async getAllAlbums(): Promise<PhotoAlbum[]> { 
    try {
      const response = await fetch('/api/albums');
      if (!response.ok) throw new Error('Failed to fetch albums');
      const data = await response.json();
      
      // Map database fields to service interface
      return (data.albums || []).map((album: any) => ({
        id: album.id,
        title: album.album_title || '',
        description: album.album_description || '',
        coverImage: album.cover_image_path || '',
        category: album.category || 'Lifestyle',
        photos: (album.photos || []).map((photo: any) => ({
          id: photo.id,
          src: photo.image_path,
          alt: album.album_title, // Use album title as default alt
          caption: photo.photo_caption || '',
          order: photo.sort_order || 0
        })),
        date: album.album_date || '',
        isFeatured: album.is_featured || false,
        order: album.sort_order || 0,
        createdAt: new Date(album.created_at),
        updatedAt: new Date(album.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching albums:', error);
      // Fallback to localStorage for development
      try { 
        const s = typeof localStorage !== 'undefined' ? localStorage.getItem(this.ALBUMS_KEY) : null; 
        return s ? JSON.parse(s) : []; 
      } catch { 
        return []; 
      }
    }
  }
  async getDisplayAlbums(limit=6): Promise<PhotoAlbum[]> { const albums = await this.getAllAlbums(); return albums.sort((a,b)=>a.order-b.order).slice(0,limit); }
  
  async addAlbum(albumData: Omit<PhotoAlbum,'id'|'createdAt'|'updatedAt'>): Promise<boolean> { 
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      });
      
      if (!response.ok) throw new Error('Failed to create album');
      return true;
    } catch (error) {
      console.error('Error adding album:', error);
      return false;
    }
  }
  
  async updateAlbum(id: string, updates: Partial<PhotoAlbum>): Promise<boolean> { 
    try {
      const response = await fetch(`/api/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update album');
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
      
      if (!response.ok) throw new Error('Failed to delete album');
      return true;
    } catch (error) {
      console.error('Error deleting album:', error);
      return false;
    }
  }
  async addPhotoToAlbum(albumId: string, photo: Omit<Photo,'id'>): Promise<boolean> { 
    try { 
      const albums = await this.getAllAlbums(); 
      const i = albums.findIndex(a => a.id === albumId); 
      if(i === -1) return false; 
      const newPhoto: Photo = { ...photo, id: Date.now().toString() }; 
      albums[i].photos.push(newPhoto); 
      albums[i].updatedAt = new Date(); 
      this.saveAlbums(albums); 
      return true;
    } catch {
      return false;
    } 
  }
  async removePhotoFromAlbum(albumId: string, photoId: string): Promise<boolean> { 
    try { 
      const albums = await this.getAllAlbums(); 
      const i = albums.findIndex(a => a.id === albumId); 
      if(i === -1) return false; 
      albums[i].photos = albums[i].photos.filter(p => p.id !== photoId); 
      albums[i].updatedAt = new Date(); 
      this.saveAlbums(albums); 
      return true;
    } catch {
      return false;
    } 
  }
  async exportData(): Promise<string> { 
    const storedVlogs = typeof localStorage !== 'undefined' ? localStorage.getItem(this.VLOGS_KEY) : null; 
    const vlogs = storedVlogs ? JSON.parse(storedVlogs) : this.getDefaultVlogs();
    const albums = await this.getAllAlbums();
    return JSON.stringify({ vlogs, albums }, null, 2); 
  }
  importData(json: string): boolean { try { const d=JSON.parse(json); if(d.vlogs) this.saveVlogs(d.vlogs); if(d.albums) this.saveAlbums(d.albums); return true;} catch {return false;} }
  async getStats() { const v=await this.getAllVlogs(); const a=await this.getAllAlbums(); return { totalVlogs: v.length, featuredVlogs: v.filter(x=>x.isFeatured).length, totalAlbums: a.length, totalPhotos: a.reduce((s,al)=>s+al.photos.length,0), categories: a.reduce((m,al)=>{(m as any)[al.category]=(m as any)[al.category] ? (m as any)[al.category]+1 : 1; return m; }, {} as Record<string, number>) } }

  private saveVlogs(v: VlogVideo[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.VLOGS_KEY, JSON.stringify(v)); }
  private saveAlbums(a: PhotoAlbum[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.ALBUMS_KEY, JSON.stringify(a)); }
  private savePlaylists(p: SpotifyPlaylist[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(p)); }

  private getDefaultVlogs(): VlogVideo[] { 
    // No default videos - all videos should be user-inputted through the admin dashboard
    return []; 
  }

  private getDefaultAlbums(): PhotoAlbum[] { return [
    { id:'1', title:'Morning Rituals', description:'Start your day with intention', coverImage:'/img1.JPEG', category:'Lifestyle', photos:[{id:'1',src:'/img1.JPEG',alt:'Morning coffee ritual',caption:'Coffee time',order:1},{id:'2',src:'/img2.JPG',alt:'Kitchen workspace',caption:'Preparing breakfast',order:2}], date:'2024-01-15', isFeatured:true, order:1, createdAt:new Date(), updatedAt:new Date() },
    { id:'2', title:'Desert Adventures', description:'Exploring Arizona landscapes', coverImage:'/img3.jpg', category:'Travel', photos:[{id:'3',src:'/img3.jpg',alt:'Desert sunset',caption:'Golden hour',order:1}], date:'2024-01-10', isFeatured:false, order:2, createdAt:new Date(), updatedAt:new Date() },
    { id:'3', title:'Healthy Creations', description:'Plant-based meal prep', coverImage:'/img4.JPG', category:'Food', photos:[{id:'4',src:'/img4.JPG',alt:'Smoothie bowl creation',caption:'Berry bowl',order:1},{id:'5',src:'/img5.JPG',alt:'Yoga session',caption:'Mindful movement',order:2}], date:'2024-01-08', isFeatured:false, order:3, createdAt:new Date(), updatedAt:new Date() },
    { id:'4', title:'Wellness Journey', description:'Mind, body, and soul care', coverImage:'/img6.jpg', category:'Wellness', photos:[{id:'6',src:'/img6.jpg',alt:'Grocery shopping',caption:'Fresh ingredients',order:1},{id:'7',src:'/img7.JPG',alt:'Recipe testing',caption:'Kitchen experiments',order:2}], date:'2024-01-05', isFeatured:false, order:4, createdAt:new Date(), updatedAt:new Date() },
    { id:'5', title:'Home Sweet Home', description:'Creating beautiful spaces', coverImage:'/test_1.JPG', category:'Lifestyle', photos:[{id:'8',src:'/test_1.JPG',alt:'Nature walk',caption:'Outdoor time',order:1}], date:'2024-01-03', isFeatured:false, order:5, createdAt:new Date(), updatedAt:new Date() },
    { id:'6', title:'Fitness & Movement', description:'Staying active and energized', coverImage:'/test_1.JPG', category:'Fitness', photos:[{id:'9',src:'/test_1.JPG',alt:'Meal prep session',caption:'Weekly prep',order:1},{id:'10',src:'/test_1.JPG',alt:'Reading time',caption:'Learning moments',order:2}], date:'2024-01-01', isFeatured:false, order:6, createdAt:new Date(), updatedAt:new Date() }
  ]; }

  private getDefaultPlaylists(): SpotifyPlaylist[] { return [
    { id:'1', name:'Switching Timezones', mood:'Chill Vibes', color:'#2D2D2D', spotifyUrl:'https://open.spotify.com/playlist/4i1BwxDwkjbJNGvhnhEH5P', order:1, isActive:true, createdAt:new Date(), updatedAt:new Date() },
    { id:'2', name:'Soulmates', mood:'Energy Boost', color:'#E91429', spotifyUrl:'https://open.spotify.com/playlist/4Bp1HuaVuGrjJRz10hWfkf', order:2, isActive:true, createdAt:new Date(), updatedAt:new Date() },
    { id:'3', name:'Ready 4 Summer', mood:'Feel Good', color:'#1E3A8A', spotifyUrl:'https://open.spotify.com/playlist/7uZas1QudcmrU21IUtwd5Q', order:3, isActive:true, createdAt:new Date(), updatedAt:new Date() }
  ]; }

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

