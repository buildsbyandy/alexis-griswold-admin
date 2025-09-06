export interface VlogVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: string;
  duration: string;
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

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  order: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  isActive: boolean;
  previewColor?: string; // Hex color for preview card background
  stylizedTitle?: string; // Emoji-enhanced display title
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

  // Get all vlog videos
  getAllVlogs(): VlogVideo[] {
    try {
      const stored = localStorage.getItem(this.VLOGS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultVlogs();
    } catch {
      return this.getDefaultVlogs();
    }
  }

  // Get featured vlog (first in order)
  getFeaturedVlog(): VlogVideo | null {
    const vlogs = this.getAllVlogs();
    return vlogs.find(vlog => vlog.isFeatured) || vlogs[0] || null;
  }

  // Get vlogs for display (excluding featured)
  getDisplayVlogs(limit: number = 6): VlogVideo[] {
    const vlogs = this.getAllVlogs();
    return vlogs
      .filter(vlog => !vlog.isFeatured)
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);
  }

  // Get personal vlog videos
  getPersonalVlogs(): VlogVideo[] {
    return this.getDefaultPersonalVlogs();
  }

  // Add new vlog
  addVlog(vlogData: Omit<VlogVideo, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const vlogs = this.getAllVlogs();
      const newVlog: VlogVideo = {
        ...vlogData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vlogs.push(newVlog);
      this.saveVlogs(vlogs);
      return true;
    } catch {
      return false;
    }
  }

  // Update vlog
  updateVlog(id: string, updates: Partial<VlogVideo>): boolean {
    try {
      const vlogs = this.getAllVlogs();
      const index = vlogs.findIndex(vlog => vlog.id === id);
      
      if (index === -1) return false;
      
      vlogs[index] = {
        ...vlogs[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      this.saveVlogs(vlogs);
      return true;
    } catch {
      return false;
    }
  }

  // Delete vlog
  deleteVlog(id: string): boolean {
    try {
      const vlogs = this.getAllVlogs();
      const filtered = vlogs.filter(vlog => vlog.id !== id);
      this.saveVlogs(filtered);
      return true;
    } catch {
      return false;
    }
  }

  // Get YouTube channel URL
  getYouTubeChannelUrl(): string {
    return this.YOUTUBE_CHANNEL_URL;
  }

  // Get Instagram URL
  getInstagramUrl(): string {
    return this.INSTAGRAM_URL;
  }

  // Get Spotify profile URL
  getSpotifyProfileUrl(): string {
    return this.SPOTIFY_PROFILE_URL;
  }

  // Spotify Playlists
  getAllPlaylists(): SpotifyPlaylist[] {
    try {
      const stored = localStorage.getItem(this.PLAYLISTS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultPlaylists();
    } catch {
      return this.getDefaultPlaylists();
    }
  }

  // Get active playlists for display
  getDisplayPlaylists(limit: number = 3): SpotifyPlaylist[] {
    const playlists = this.getAllPlaylists();
    return playlists
      .filter(playlist => playlist.isActive)
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);
  }

  // Add new playlist
  addPlaylist(playlistData: Omit<SpotifyPlaylist, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const playlists = this.getAllPlaylists();
      const newPlaylist: SpotifyPlaylist = {
        ...playlistData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      playlists.push(newPlaylist);
      this.savePlaylists(playlists);
      return true;
    } catch {
      return false;
    }
  }

  // Update playlist
  updatePlaylist(id: string, updates: Partial<SpotifyPlaylist>): boolean {
    try {
      const playlists = this.getAllPlaylists();
      const index = playlists.findIndex(playlist => playlist.id === id);
      
      if (index === -1) return false;
      
      playlists[index] = {
        ...playlists[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      this.savePlaylists(playlists);
      return true;
    } catch {
      return false;
    }
  }

  // Delete playlist
  deletePlaylist(id: string): boolean {
    try {
      const playlists = this.getAllPlaylists();
      const filtered = playlists.filter(playlist => playlist.id !== id);
      this.savePlaylists(filtered);
      return true;
    } catch {
      return false;
    }
  }

  // Photo Albums
  getAllAlbums(): PhotoAlbum[] {
    try {
      const stored = localStorage.getItem(this.ALBUMS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultAlbums();
    } catch {
      return this.getDefaultAlbums();
    }
  }

  // Get albums for display
  getDisplayAlbums(limit: number = 6): PhotoAlbum[] {
    const albums = this.getAllAlbums();
    return albums
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);
  }

  // Add new album
  addAlbum(albumData: Omit<PhotoAlbum, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const albums = this.getAllAlbums();
      const newAlbum: PhotoAlbum = {
        ...albumData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      albums.push(newAlbum);
      this.saveAlbums(albums);
      return true;
    } catch {
      return false;
    }
  }

  // Update album
  updateAlbum(id: string, updates: Partial<PhotoAlbum>): boolean {
    try {
      const albums = this.getAllAlbums();
      const index = albums.findIndex(album => album.id === id);
      
      if (index === -1) return false;
      
      albums[index] = {
        ...albums[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      this.saveAlbums(albums);
      return true;
    } catch {
      return false;
    }
  }

  // Delete album
  deleteAlbum(id: string): boolean {
    try {
      const albums = this.getAllAlbums();
      const filtered = albums.filter(album => album.id !== id);
      this.saveAlbums(filtered);
      return true;
    } catch {
      return false;
    }
  }

  // Add photo to album
  addPhotoToAlbum(albumId: string, photoData: Omit<Photo, 'id'>): boolean {
    try {
      const albums = this.getAllAlbums();
      const albumIndex = albums.findIndex(album => album.id === albumId);
      
      if (albumIndex === -1) return false;
      
      const newPhoto: Photo = {
        ...photoData,
        id: Date.now().toString(),
      };
      
      albums[albumIndex].photos.push(newPhoto);
      albums[albumIndex].updatedAt = new Date();
      
      this.saveAlbums(albums);
      return true;
    } catch {
      return false;
    }
  }

  // Remove photo from album
  removePhotoFromAlbum(albumId: string, photoId: string): boolean {
    try {
      const albums = this.getAllAlbums();
      const albumIndex = albums.findIndex(album => album.id === albumId);
      
      if (albumIndex === -1) return false;
      
      albums[albumIndex].photos = albums[albumIndex].photos.filter(photo => photo.id !== photoId);
      albums[albumIndex].updatedAt = new Date();
      
      this.saveAlbums(albums);
      return true;
    } catch {
      return false;
    }
  }

  // Export data
  exportData(): string {
    const data = {
      vlogs: this.getAllVlogs(),
      albums: this.getAllAlbums(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.vlogs) {
        this.saveVlogs(data.vlogs);
      }
      if (data.albums) {
        this.saveAlbums(data.albums);
      }
      return true;
    } catch {
      return false;
    }
  }

  // Get stats
  getStats() {
    const vlogs = this.getAllVlogs();
    const albums = this.getAllAlbums();
    
    return {
      totalVlogs: vlogs.length,
      featuredVlogs: vlogs.filter(v => v.isFeatured).length,
      totalAlbums: albums.length,
      totalPhotos: albums.reduce((sum, album) => sum + album.photos.length, 0),
      categories: albums.reduce((cats, album) => {
        cats[album.category] = (cats[album.category] || 0) + 1;
        return cats;
      }, {} as Record<string, number>),
    };
  }

  // Private methods
  private saveVlogs(vlogs: VlogVideo[]): void {
    localStorage.setItem(this.VLOGS_KEY, JSON.stringify(vlogs));
  }

  private saveAlbums(albums: PhotoAlbum[]): void {
    localStorage.setItem(this.ALBUMS_KEY, JSON.stringify(albums));
  }

  private savePlaylists(playlists: SpotifyPlaylist[]): void {
    localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(playlists));
  }

  private getDefaultVlogs(): VlogVideo[] {
    return [
      {
        id: 'MYmmbSZ4YaQ',
        title: 'Morning Routine & Healthy Breakfast',
        description: 'Start your day with energy and intention',
        thumbnailUrl: 'https://img.youtube.com/vi/MYmmbSZ4YaQ/hqdefault.jpg',
        publishedAt: '2024-01-15',
        views: '12.5K',
        duration: '8:32',
        isFeatured: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '6AvOegDnEb0',
        title: 'Raw Vegan Meal Prep',
        description: 'Simple and delicious plant-based meals',
        thumbnailUrl: 'https://img.youtube.com/vi/6AvOegDnEb0/hqdefault.jpg',
        publishedAt: '2024-01-12',
        views: '8.9K',
        duration: '12:45',
        isFeatured: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'qBXducGwqxY',
        title: 'Travel Vlog: Arizona Adventures',
        description: 'Exploring the beautiful desert landscapes',
        thumbnailUrl: 'https://img.youtube.com/vi/qBXducGwqxY/hqdefault.jpg',
        publishedAt: '2024-01-08',
        views: '15.2K',
        duration: '18:20',
        isFeatured: false,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'JFgukuIduPs',
        title: 'Smoothie Bowl Tutorial',
        description: 'How to make Instagram-worthy smoothie bowls',
        thumbnailUrl: 'https://img.youtube.com/vi/JFgukuIduPs/hqdefault.jpg',
        publishedAt: '2024-01-05',
        views: '10.7K',
        duration: '6:15',
        isFeatured: false,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '1qilUaxl5Ss',
        title: 'Self-Care Sunday Routine',
        description: 'Nurturing mind, body, and soul',
        thumbnailUrl: 'https://img.youtube.com/vi/1qilUaxl5Ss/hqdefault.jpg',
        publishedAt: '2024-01-01',
        views: '9.3K',
        duration: '14:28',
        isFeatured: false,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'j43tVo2Y07E',
        title: 'Kitchen Organization Tips',
        description: 'Creating a functional and beautiful space',
        thumbnailUrl: 'https://img.youtube.com/vi/j43tVo2Y07E/hqdefault.jpg',
        publishedAt: '2023-12-28',
        views: '7.8K',
        duration: '11:42',
        isFeatured: false,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  private getDefaultAlbums(): PhotoAlbum[] {
    return [
      {
        id: '1',
        title: 'Morning Rituals',
        description: 'Start your day with intention',
        coverImage: '/img1.JPEG',
        category: 'Lifestyle',
        photos: [
          { id: '1', src: '/img1.JPEG', alt: 'Morning coffee ritual', caption: 'Coffee time', order: 1 },
          { id: '2', src: '/img2.JPG', alt: 'Kitchen workspace', caption: 'Preparing breakfast', order: 2 },
        ],
        date: '2024-01-15',
        isFeatured: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Desert Adventures',
        description: 'Exploring Arizona landscapes',
        coverImage: '/img3.jpg',
        category: 'Travel',
        photos: [
          { id: '3', src: '/img3.jpg', alt: 'Desert sunset', caption: 'Golden hour', order: 1 },
        ],
        date: '2024-01-10',
        isFeatured: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        title: 'Healthy Creations',
        description: 'Plant-based meal prep',
        coverImage: '/img4.JPG',
        category: 'Food',
        photos: [
          { id: '4', src: '/img4.JPG', alt: 'Smoothie bowl creation', caption: 'Berry bowl', order: 1 },
          { id: '5', src: '/img5.JPG', alt: 'Yoga session', caption: 'Mindful movement', order: 2 },
        ],
        date: '2024-01-08',
        isFeatured: false,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        title: 'Wellness Journey',
        description: 'Mind, body, and soul care',
        coverImage: '/img6.jpg',
        category: 'Wellness',
        photos: [
          { id: '6', src: '/img6.jpg', alt: 'Grocery shopping', caption: 'Fresh ingredients', order: 1 },
          { id: '7', src: '/img7.JPG', alt: 'Recipe testing', caption: 'Kitchen experiments', order: 2 },
        ],
        date: '2024-01-05',
        isFeatured: false,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5',
        title: 'Home Sweet Home',
        description: 'Creating beautiful spaces',
        coverImage: '/test_1.JPG',
        category: 'Lifestyle',
        photos: [
          { id: '8', src: '/test_1.JPG', alt: 'Nature walk', caption: 'Outdoor time', order: 1 },
        ],
        date: '2024-01-03',
        isFeatured: false,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '6',
        title: 'Fitness & Movement',
        description: 'Staying active and energized',
        coverImage: '/test_1.JPG',
        category: 'Fitness',
        photos: [
          { id: '9', src: '/test_1.JPG', alt: 'Meal prep session', caption: 'Weekly prep', order: 1 },
          { id: '10', src: '/test_1.JPG', alt: 'Reading time', caption: 'Learning moments', order: 2 },
        ],
        date: '2024-01-01',
        isFeatured: false,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  private getDefaultPlaylists(): SpotifyPlaylist[] {
    return [
      {
        id: '1',
        name: 'Playlist 1',
        description: 'A great playlist',
        url: 'https://open.spotify.com/playlist/4i1BwxDwkjbJNGvhnhEH5P',
        order: 1,
        isActive: true,
        previewColor: '#2D2D2D', // Dark gray like Spotify's "Switching timezones"
        stylizedTitle: '🌅 Switching Timezones 🌇',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Playlist 2',
        description: 'Another great playlist',
        url: 'https://open.spotify.com/playlist/4Bp1HuaVuGrjJRz10hWfkf',
        order: 2,
        isActive: true,
        previewColor: '#E91429', // Deep red like Spotify's "Soulmates"
        stylizedTitle: '🏵️ Soulmates 🏵️',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Playlist 3',
        description: 'More music to enjoy',
        url: 'https://open.spotify.com/playlist/7uZas1QudcmrU21IUtwd5Q',
        order: 3,
        isActive: true,
        previewColor: '#1E3A8A', // Dark blue like Spotify's "Ready 4 Summer"
        stylizedTitle: '🏖️ Ready 4 Summer 💦',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  private getDefaultPersonalVlogs(): VlogVideo[] {
    return [
      {
        id: 'JAV_AgwUNzI',
        title: 'Personal Vlog: Daily Reflections',
        description: 'Thoughts on mindfulness and personal growth',
        thumbnailUrl: 'https://img.youtube.com/vi/JAV_AgwUNzI/hqdefault.jpg',
        publishedAt: '2024-01-15',
        views: '2.1K',
        duration: '8:45',
        isFeatured: false,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'DYGGRHpSMOs',
        title: 'Personal Vlog: Wellness Journey',
        description: 'Exploring holistic health and wellness practices',
        thumbnailUrl: 'https://img.youtube.com/vi/DYGGRHpSMOs/hqdefault.jpg',
        publishedAt: '2024-01-12',
        views: '1.8K',
        duration: '12:30',
        isFeatured: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'NrjqEH0tghQ',
        title: 'Personal Vlog: Mindful Living',
        description: 'Simple practices for a more intentional life',
        thumbnailUrl: 'https://img.youtube.com/vi/NrjqEH0tghQ/hqdefault.jpg',
        publishedAt: '2024-01-10',
        views: '1.5K',
        duration: '10:20',
        isFeatured: false,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5lNcMk0-owo',
        title: 'Personal Vlog: Spiritual Growth',
        description: 'Deepening connection with mind, body, and spirit',
        thumbnailUrl: 'https://img.youtube.com/vi/5lNcMk0-owo/hqdefault.jpg',
        publishedAt: '2024-01-08',
        views: '1.3K',
        duration: '15:45',
        isFeatured: false,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'FU2g2fUrdpE',
        title: 'Personal Vlog: Life Lessons',
        description: 'Sharing insights and wisdom from daily experiences',
        thumbnailUrl: 'https://img.youtube.com/vi/FU2g2fUrdpE/hqdefault.jpg',
        publishedAt: '2024-01-05',
        views: '1.1K',
        duration: '9:15',
        isFeatured: false,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }
}

export const vlogService = new VlogService();
export default vlogService; 