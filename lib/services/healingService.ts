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
        amazonUrl: p.product_link || '',
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

  // Video Carousels - Using existing carousel system
  async getAllVideos(): Promise<HealingVideo[]> {
    try {
      // Fetch healing carousels and their videos
      const response = await fetch('/api/healing/carousels');
      if (!response.ok) throw new Error('Failed to fetch healing carousels');
      const data = await response.json();
      
      // Map carousel videos to healing video interface
      const allVideos: HealingVideo[] = [];
      
      for (const carousel of data.carousels || []) {
        const carouselType = carousel.carousel_number === 1 ? 'part1' : 'part2';
        
        for (const video of carousel.videos || []) {
          allVideos.push({
            id: video.id,
            title: video.video_title || '',
            description: video.video_description || '',
            youtubeUrl: video.youtube_url || '',
            youtubeId: this.extractYouTubeId(video.youtube_url || '') || undefined,
            thumbnailUrl: this.getYouTubeThumbnail(video.youtube_url) || '',
            duration: '', // Not stored in carousel_videos table
            carousel: carouselType,
            order: video.video_order || 0,
            isActive: true, // All carousel videos are considered active
            createdAt: new Date(video.created_at),
            updatedAt: new Date(video.updated_at)
          });
        }
      }
      
      return allVideos;
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

      // Convert carousel type to carousel number
      const carouselNumber = video.carousel === 'part1' ? 1 : 2;

      const response = await fetch('/api/healing/carousel-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_type: 'healing',
          carousel_number: carouselNumber,
          youtube_url: video.youtubeUrl,
          video_title: video.title,
          video_description: video.description,
          video_order: video.order
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
      
      if (video.title !== undefined) updateData.video_title = video.title;
      if (video.description !== undefined) updateData.video_description = video.description;
      if (video.order !== undefined) updateData.video_order = video.order;

      // Handle YouTube URL updates
      if (video.youtubeUrl !== undefined) {
        if (!this.validateYouTubeUrl(video.youtubeUrl)) {
          throw new Error('Invalid YouTube URL');
        }
        updateData.youtube_url = video.youtubeUrl;
      }

      // Handle carousel changes (requires moving to different carousel)
      if (video.carousel !== undefined) {
        const carouselNumber = video.carousel === 'part1' ? 1 : 2;
        updateData.carousel_number = carouselNumber;
      }

      const response = await fetch(`/api/healing/carousel-videos/${id}`, {
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
      const response = await fetch(`/api/healing/carousel-videos/${id}`, {
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