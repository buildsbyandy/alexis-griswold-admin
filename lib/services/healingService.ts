// Service for managing healing section content
import type { HealingProduct } from '../../components/modals/HealingProductModal';
import type { CarouselHeader } from '../../components/modals/CarouselHeaderModal';
import type { HealingFeaturedVideo } from '../../components/modals/HealingFeaturedVideoModal';

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