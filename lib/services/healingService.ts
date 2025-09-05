// Service for managing healing section content
import type { HealingProduct } from '../../components/modals/HealingProductModal';
import type { CarouselHeader } from '../../components/modals/CarouselHeaderModal';
import type { HealingFeaturedVideo } from '../../components/modals/HealingFeaturedVideoModal';

export type HealingCarouselType = 'part1' | 'part2';

export interface HealingVideo {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId?: string;
  thumbnailUrl: string;
  duration: string;
  views: string;
  carousel: HealingCarouselType;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class HealingService {
  // Healing Products
  async getAllProducts(): Promise<HealingProduct[]> {
    try {
      const response = await fetch('/api/healing/products');
      if (!response.ok) throw new Error('Failed to fetch healing products');
      const data = await response.json();
      
      // Map database fields to service interface
      return (data.products || []).map((p: any) => ({
        id: p.id,
        name: p.product_title,
        purpose: p.product_purpose || '',
        howToUse: p.how_to_use || '',
        imageUrl: p.product_image_path || '',
        amazonUrl: p.amazonUrl || '',
        isActive: p.is_active || false,
        order: p.product_order || 0,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching healing products:', error);
      return [];
    }
  }

  async addProduct(product: Omit<HealingProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const response = await fetch('/api/healing/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding healing product:', error);
      return false;
    }
  }

  async updateProduct(id: string, product: Partial<HealingProduct>): Promise<boolean> {
    try {
      const response = await fetch(`/api/healing/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating healing product:', error);
      return false;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/healing/products/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting healing product:', error);
      return false;
    }
  }

  // Carousel Headers
  async getCarouselHeaders(): Promise<CarouselHeader[]> {
    try {
      const response = await fetch('/api/healing/carousel-headers');
      if (!response.ok) throw new Error('Failed to fetch carousel headers');
      const data = await response.json();
      
      // Map database fields to service interface
      return (data.headers || []).map((h: any) => ({
        id: h.id,
        title: h.header || '',
        description: h.subtitle || '',
        type: h.carousel_number === 1 ? 'part1' : 'part2',
        isActive: true, // Always active from database perspective
        updatedAt: new Date(h.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching carousel headers:', error);
      return [];
    }
  }

  async updateCarouselHeader(header: Omit<CarouselHeader, 'id' | 'updatedAt'>): Promise<boolean> {
    try {
      const response = await fetch('/api/healing/carousel-headers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(header)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating carousel header:', error);
      return false;
    }
  }

  // Featured Video
  async getFeaturedVideo(): Promise<HealingFeaturedVideo | null> {
    try {
      const response = await fetch('/api/healing/featured-video');
      if (!response.ok) throw new Error('Failed to fetch featured video');
      const data = await response.json();
      
      if (!data.video) return null;
      
      const v = data.video;
      return {
        id: v.id,
        title: v.hero_video_title || '',
        description: v.hero_video_subtitle || '',
        videoUrl: v.hero_video_youtube_url || '',
        thumbnailUrl: this.getYouTubeThumbnail(v.hero_video_youtube_url) || '',
        duration: '', // Not stored in database
        publishedAt: v.hero_video_date || '',
        isActive: true,
        updatedAt: new Date(v.updated_at)
      };
    } catch (error) {
      console.error('Error fetching featured video:', error);
      return null;
    }
  }

  async updateFeaturedVideo(video: Omit<HealingFeaturedVideo, 'id' | 'updatedAt'>): Promise<boolean> {
    try {
      const response = await fetch('/api/healing/featured-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating featured video:', error);
      return false;
    }
  }

  // Video Carousels
  async getAllVideos(): Promise<HealingVideo[]> {
    try {
      const response = await fetch('/api/healing/videos');
      if (!response.ok) throw new Error('Failed to fetch healing videos');
      const data = await response.json();
      
      // Map database fields to service interface
      return (data.videos || []).map((v: any) => ({
        id: v.id,
        title: v.title || '',
        description: v.description || '',
        youtubeUrl: v.youtube_url || '',
        youtubeId: v.youtube_id || this.extractYouTubeId(v.youtube_url || ''),
        thumbnailUrl: v.thumbnail_url || this.getYouTubeThumbnail(v.youtube_url),
        duration: v.duration || '',
        views: v.views || '',
        carousel: (v.carousel || 'part1') as HealingCarouselType,
        order: v.display_order || 0,
        isActive: v.is_active !== false,
        createdAt: new Date(v.created_at),
        updatedAt: new Date(v.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching healing videos:', error);
      // Fallback to localStorage for development
      return this.getDefaultVideos();
    }
  }

  async getVideosByCarousel(carousel: HealingCarouselType): Promise<HealingVideo[]> {
    const allVideos = await this.getAllVideos();
    return allVideos
      .filter(v => v.carousel === carousel && v.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async addVideo(video: Omit<HealingVideo, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      // Validate and process YouTube URL
      if (!this.validateYouTubeUrl(video.youtubeUrl)) {
        throw new Error('Invalid YouTube URL');
      }

      const youtubeId = this.extractYouTubeId(video.youtubeUrl);
      if (!youtubeId) {
        throw new Error('Could not extract YouTube ID from URL');
      }

      // Auto-generate thumbnail if not provided
      const thumbnailUrl = video.thumbnailUrl || this.getYouTubeThumbnail(video.youtubeUrl);

      const response = await fetch('/api/healing/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          youtube_url: video.youtubeUrl,
          youtube_id: youtubeId,
          thumbnail_url: thumbnailUrl,
          duration: video.duration,
          views: video.views,
          carousel: video.carousel,
          display_order: video.order,
          is_active: video.isActive
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding healing video:', error);
      return false;
    }
  }

  async updateVideo(id: string, video: Partial<HealingVideo>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (video.title !== undefined) updateData.title = video.title;
      if (video.description !== undefined) updateData.description = video.description;
      if (video.duration !== undefined) updateData.duration = video.duration;
      if (video.views !== undefined) updateData.views = video.views;
      if (video.carousel !== undefined) updateData.carousel = video.carousel;
      if (video.order !== undefined) updateData.display_order = video.order;
      if (video.isActive !== undefined) updateData.is_active = video.isActive;

      // Handle YouTube URL updates
      if (video.youtubeUrl !== undefined) {
        if (!this.validateYouTubeUrl(video.youtubeUrl)) {
          throw new Error('Invalid YouTube URL');
        }
        const youtubeId = this.extractYouTubeId(video.youtubeUrl);
        if (!youtubeId) {
          throw new Error('Could not extract YouTube ID from URL');
        }
        updateData.youtube_url = video.youtubeUrl;
        updateData.youtube_id = youtubeId;
        // Auto-update thumbnail if not explicitly provided
        if (video.thumbnailUrl === undefined) {
          updateData.thumbnail_url = this.getYouTubeThumbnail(video.youtubeUrl);
        }
      }

      const response = await fetch(`/api/healing/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating healing video:', error);
      return false;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/healing/videos/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting healing video:', error);
      return false;
    }
  }

  // Default videos for development/fallback
  private getDefaultVideos(): HealingVideo[] {
    return [
      {
        id: '1',
        title: 'Candida Cleanse Introduction',
        description: 'Understanding the candida cleansing process and what to expect',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: '12:45',
        views: '2.4K',
        carousel: 'part1',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Anti-Candida Diet Plan',
        description: 'Foods to eat and avoid during your candida cleanse',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: '8:30',
        views: '1.8K',
        carousel: 'part1',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Gut Microbiome Restoration',
        description: 'How to rebuild healthy gut bacteria after cleansing',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: '10:20',
        views: '3.1K',
        carousel: 'part2',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        title: 'Probiotic Foods Guide',
        description: 'Essential probiotic foods for gut health recovery',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: '14:20',
        views: '2.7K',
        carousel: 'part2',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // YouTube utility methods
  private validateYouTubeUrl(url: string): boolean {
    const youTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w\-]{11}/;
    return youTubeRegex.test(url);
  }

  private extractYouTubeId(url: string): string | null {
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

  // Helper method to extract YouTube thumbnail
  private getYouTubeThumbnail(url: string): string | null {
    if (!url) return null;
    const videoId = this.getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  }

  private getYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }
}

export const healingService = new HealingService();
export default healingService;