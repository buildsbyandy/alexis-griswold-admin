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

export interface Photo { id: string; src: string; alt: string; caption?: string; order: number; }

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  isActive: boolean;
  previewColor?: string;
  stylizedTitle?: string;
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

  getAllVlogs(): VlogVideo[] {
    try { const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.VLOGS_KEY) : null; return stored ? JSON.parse(stored) : this.getDefaultVlogs(); } catch { return this.getDefaultVlogs(); }
  }
  getFeaturedVlog(): VlogVideo | null { const v = this.getAllVlogs(); return v.find(x => x.isFeatured) || v[0] || null; }
  getDisplayVlogs(limit = 6): VlogVideo[] { return this.getAllVlogs().filter(v => !v.isFeatured).sort((a,b)=>a.order-b.order).slice(0, limit); }
  getPersonalVlogs(): VlogVideo[] { return this.getAllVlogs().filter(v => (v as any).type === 'PERSONAL'); }
  addVlog(input: Omit<VlogVideo,'id'|'createdAt'|'updatedAt'>): boolean { try { const v = this.getAllVlogs(); v.push({ ...input, id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() }); this.saveVlogs(v); return true; } catch { return false; } }
  updateVlog(id: string, u: Partial<VlogVideo>): boolean { try { const v=this.getAllVlogs(); const i=v.findIndex(x=>x.id===id); if(i===-1) return false; v[i]={...v[i],...u,updatedAt:new Date()}; this.saveVlogs(v); return true;} catch {return false;} }
  deleteVlog(id: string): boolean { try { const next=this.getAllVlogs().filter(v=>v.id!==id); this.saveVlogs(next); return true;} catch {return false;} }
  getYouTubeChannelUrl(): string { return this.YOUTUBE_CHANNEL_URL; }
  getInstagramUrl(): string { return this.INSTAGRAM_URL; }
  getSpotifyProfileUrl(): string { return this.SPOTIFY_PROFILE_URL; }

  getAllPlaylists(): SpotifyPlaylist[] { try { const s = typeof localStorage !== 'undefined' ? localStorage.getItem(this.PLAYLISTS_KEY) : null; return s ? JSON.parse(s) : this.getDefaultPlaylists(); } catch { return this.getDefaultPlaylists(); } }
  getDisplayPlaylists(limit=3): SpotifyPlaylist[] { return this.getAllPlaylists().filter(p=>p.isActive).sort((a,b)=>a.order-b.order).slice(0,limit); }
  addPlaylist(p: Omit<SpotifyPlaylist,'id'|'createdAt'|'updatedAt'>): boolean { try { const list=this.getAllPlaylists(); list.push({ ...p, id: Date.now().toString(), createdAt:new Date(), updatedAt:new Date() }); this.savePlaylists(list); return true;} catch {return false;} }
  updatePlaylist(id: string, u: Partial<SpotifyPlaylist>): boolean { try { const list=this.getAllPlaylists(); const i=list.findIndex(x=>x.id===id); if(i===-1) return false; list[i]={...list[i],...u,updatedAt:new Date()}; this.savePlaylists(list); return true;} catch {return false;} }
  deletePlaylist(id: string): boolean { try { const list=this.getAllPlaylists().filter(p=>p.id!==id); this.savePlaylists(list); return true;} catch {return false;} }

  getAllAlbums(): PhotoAlbum[] { try { const s= typeof localStorage !== 'undefined' ? localStorage.getItem(this.ALBUMS_KEY) : null; return s ? JSON.parse(s) : this.getDefaultAlbums(); } catch { return this.getDefaultAlbums(); } }
  getDisplayAlbums(limit=6): PhotoAlbum[] { return this.getAllAlbums().sort((a,b)=>a.order-b.order).slice(0,limit); }
  addAlbum(a: Omit<PhotoAlbum,'id'|'createdAt'|'updatedAt'>): boolean { try { const list=this.getAllAlbums(); list.push({ ...a, id: Date.now().toString(), createdAt:new Date(), updatedAt:new Date() }); this.saveAlbums(list); return true;} catch {return false;} }
  updateAlbum(id: string, u: Partial<PhotoAlbum>): boolean { try { const list=this.getAllAlbums(); const i=list.findIndex(x=>x.id===id); if(i===-1) return false; list[i]={...list[i],...u,updatedAt:new Date()}; this.saveAlbums(list); return true;} catch {return false;} }
  deleteAlbum(id: string): boolean { try { const list=this.getAllAlbums().filter(a=>a.id!==id); this.saveAlbums(list); return true;} catch {return false;} }
  addPhotoToAlbum(albumId: string, photo: Omit<Photo,'id'>): boolean { try { const albums=this.getAllAlbums(); const i=albums.findIndex(a=>a.id===albumId); if(i===-1) return false; const newPhoto: Photo = { ...photo, id: Date.now().toString() }; albums[i].photos.push(newPhoto); albums[i].updatedAt=new Date(); this.saveAlbums(albums); return true;} catch {return false;} }
  removePhotoFromAlbum(albumId: string, photoId: string): boolean { try { const albums=this.getAllAlbums(); const i=albums.findIndex(a=>a.id===albumId); if(i===-1) return false; albums[i].photos = albums[i].photos.filter(p=>p.id!==photoId); albums[i].updatedAt=new Date(); this.saveAlbums(albums); return true;} catch {return false;} }
  exportData(): string { return JSON.stringify({ vlogs: this.getAllVlogs(), albums: this.getAllAlbums() }, null, 2); }
  importData(json: string): boolean { try { const d=JSON.parse(json); if(d.vlogs) this.saveVlogs(d.vlogs); if(d.albums) this.saveAlbums(d.albums); return true;} catch {return false;} }
  getStats() { const v=this.getAllVlogs(); const a=this.getAllAlbums(); return { totalVlogs: v.length, featuredVlogs: v.filter(x=>x.isFeatured).length, totalAlbums: a.length, totalPhotos: a.reduce((s,al)=>s+al.photos.length,0), categories: a.reduce((m,al)=>{(m as any)[al.category]=(m as any)[al.category] ? (m as any)[al.category]+1 : 1; return m; }, {} as Record<string, number>) } }

  private saveVlogs(v: VlogVideo[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.VLOGS_KEY, JSON.stringify(v)); }
  private saveAlbums(a: PhotoAlbum[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.ALBUMS_KEY, JSON.stringify(a)); }
  private savePlaylists(p: SpotifyPlaylist[]): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(p)); }

  private getDefaultVlogs(): VlogVideo[] { return [
    { id: 'MYmmbSZ4YaQ', title: 'Morning Routine & Healthy Breakfast', description: 'Start your day with energy and intention', thumbnailUrl: 'https://img.youtube.com/vi/MYmmbSZ4YaQ/hqdefault.jpg', publishedAt: '2024-01-15', views: '12.5K', duration: '8:32', isFeatured: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: '6AvOegDnEb0', title: 'Raw Vegan Meal Prep', description: 'Simple and delicious plant-based meals', thumbnailUrl: 'https://img.youtube.com/vi/6AvOegDnEb0/hqdefault.jpg', publishedAt: '2024-01-12', views: '8.9K', duration: '12:45', isFeatured: false, order: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: 'qBXducGwqxY', title: 'Travel Vlog: Arizona Adventures', description: 'Exploring the beautiful desert landscapes', thumbnailUrl: 'https://img.youtube.com/vi/qBXducGwqxY/hqdefault.jpg', publishedAt: '2024-01-08', views: '15.2K', duration: '18:20', isFeatured: false, order: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'JFgukuIduPs', title: 'Smoothie Bowl Tutorial', description: 'How to make Instagram-worthy smoothie bowls', thumbnailUrl: 'https://img.youtube.com/vi/JFgukuIduPs/hqdefault.jpg', publishedAt: '2024-01-05', views: '10.7K', duration: '6:15', isFeatured: false, order: 4, createdAt: new Date(), updatedAt: new Date() },
    { id: '1qilUaxl5Ss', title: 'Self-Care Sunday Routine', description: 'Nurturing mind, body, and soul', thumbnailUrl: 'https://img.youtube.com/vi/1qilUaxl5Ss/hqdefault.jpg', publishedAt: '2024-01-01', views: '9.3K', duration: '14:28', isFeatured: false, order: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'j43tVo2Y07E', title: 'Kitchen Organization Tips', description: 'Creating a functional and beautiful space', thumbnailUrl: 'https://img.youtube.com/vi/j43tVo2Y07E/hqdefault.jpg', publishedAt: '2023-12-28', views: '7.8K', duration: '11:42', isFeatured: false, order: 6, createdAt: new Date(), updatedAt: new Date() }
  ]; }

  private getDefaultAlbums(): PhotoAlbum[] { return [
    { id:'1', title:'Morning Rituals', description:'Start your day with intention', coverImage:'/img1.JPEG', category:'Lifestyle', photos:[{id:'1',src:'/img1.JPEG',alt:'Morning coffee ritual',caption:'Coffee time',order:1},{id:'2',src:'/img2.JPG',alt:'Kitchen workspace',caption:'Preparing breakfast',order:2}], date:'2024-01-15', isFeatured:true, order:1, createdAt:new Date(), updatedAt:new Date() },
    { id:'2', title:'Desert Adventures', description:'Exploring Arizona landscapes', coverImage:'/img3.jpg', category:'Travel', photos:[{id:'3',src:'/img3.jpg',alt:'Desert sunset',caption:'Golden hour',order:1}], date:'2024-01-10', isFeatured:false, order:2, createdAt:new Date(), updatedAt:new Date() },
    { id:'3', title:'Healthy Creations', description:'Plant-based meal prep', coverImage:'/img4.JPG', category:'Food', photos:[{id:'4',src:'/img4.JPG',alt:'Smoothie bowl creation',caption:'Berry bowl',order:1},{id:'5',src:'/img5.JPG',alt:'Yoga session',caption:'Mindful movement',order:2}], date:'2024-01-08', isFeatured:false, order:3, createdAt:new Date(), updatedAt:new Date() },
    { id:'4', title:'Wellness Journey', description:'Mind, body, and soul care', coverImage:'/img6.jpg', category:'Wellness', photos:[{id:'6',src:'/img6.jpg',alt:'Grocery shopping',caption:'Fresh ingredients',order:1},{id:'7',src:'/img7.JPG',alt:'Recipe testing',caption:'Kitchen experiments',order:2}], date:'2024-01-05', isFeatured:false, order:4, createdAt:new Date(), updatedAt:new Date() },
    { id:'5', title:'Home Sweet Home', description:'Creating beautiful spaces', coverImage:'/test_1.JPG', category:'Lifestyle', photos:[{id:'8',src:'/test_1.JPG',alt:'Nature walk',caption:'Outdoor time',order:1}], date:'2024-01-03', isFeatured:false, order:5, createdAt:new Date(), updatedAt:new Date() },
    { id:'6', title:'Fitness & Movement', description:'Staying active and energized', coverImage:'/test_1.JPG', category:'Fitness', photos:[{id:'9',src:'/test_1.JPG',alt:'Meal prep session',caption:'Weekly prep',order:1},{id:'10',src:'/test_1.JPG',alt:'Reading time',caption:'Learning moments',order:2}], date:'2024-01-01', isFeatured:false, order:6, createdAt:new Date(), updatedAt:new Date() }
  ]; }

  private getDefaultPlaylists(): SpotifyPlaylist[] { return [
    { id:'1', name:'Playlist 1', description:'A great playlist', url:'https://open.spotify.com/playlist/4i1BwxDwkjbJNGvhnhEH5P', order:1, isActive:true, previewColor:'#2D2D2D', stylizedTitle:'🌅 Switching Timezones 🌇', createdAt:new Date(), updatedAt:new Date() },
    { id:'2', name:'Playlist 2', description:'Another great playlist', url:'https://open.spotify.com/playlist/4Bp1HuaVuGrjJRz10hWfkf', order:2, isActive:true, previewColor:'#E91429', stylizedTitle:'🏵️ Soulmates 🏵️', createdAt:new Date(), updatedAt:new Date() },
    { id:'3', name:'Playlist 3', description:'More music to enjoy', url:'https://open.spotify.com/playlist/7uZas1QudcmrU21IUtwd5Q', order:3, isActive:true, previewColor:'#1E3A8A', stylizedTitle:'🏖️ Ready 4 Summer 💦', createdAt:new Date(), updatedAt:new Date() }
  ]; }
}

export const vlogService = new VlogService();
export default vlogService;

