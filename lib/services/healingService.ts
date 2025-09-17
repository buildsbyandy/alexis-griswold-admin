/**
 * REFACTORED: Healing service with unified carousel schema
 * - Uses existing healing carousel API endpoints
 * - Clean interface without direct Supabase access
 * - Maintains backward compatibility with existing UI contracts
 */

import type { Database } from '@/types/supabase.generated';

// Supabase table types for products and page content
export type HealingProductRow = Database['public']['Tables']['healing_products']['Row'];
export type HealingProductInsert = Database['public']['Tables']['healing_products']['Insert'];
export type HealingProductUpdate = Database['public']['Tables']['healing_products']['Update'];

export type HealingPageContentRow = Database['public']['Tables']['healing_page_content']['Row'];
export type HealingPageContentInsert = Database['public']['Tables']['healing_page_content']['Insert'];
export type HealingPageContentUpdate = Database['public']['Tables']['healing_page_content']['Update'];

export type ContentStatus = Database['public']['Enums']['content_status'];

// Unified carousel types
export type HealingPart = 'part1' | 'part2';

export interface HealingHeaderDTO {
  type: HealingPart;
  title: string;
  description: string;
  is_active?: boolean;
}

export interface HealingVideo {
  id: string;
  carousel_id?: string | null;
  youtube_url: string;
  youtube_id: string | null;
  video_title: string;
  video_description: string | null;
  video_order: number;
  created_at?: string;
  updated_at?: string;
  // UI normalized fields
  carousel?: 'part1' | 'part2';
  isActive?: boolean;
  order?: number;
}

// Service response type
export interface HealingServiceResponse<T> {
  data?: T;
  error?: string;
}

// Legacy type aliases for backward compatibility
export type HealingCarouselType = 'part1' | 'part2';
export type HealingCarouselVideoRow = HealingVideo;

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

class HealingService {
  // Carousel headers
  async getHeaders(): Promise<HealingServiceResponse<Array<{ type: HealingPart; title: string; description: string; is_active: boolean }>>> {
    try {
      const response = await fetch('/api/healing/carousel-headers');
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to fetch headers' };
      return { data: result.data || [] };
    } catch (error) {
      return { error: 'Failed to fetch carousel headers' };
    }
  }

  async updateHeader(input: HealingHeaderDTO): Promise<HealingServiceResponse<boolean>> {
    try {
      const response = await fetch('/api/healing/carousel-headers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: input.type,
          title: input.title,
          description: input.description,
          is_active: input.is_active ?? true,
        })
      });
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to update header' };
      return { data: true };
    } catch (error) {
      return { error: 'Failed to update carousel header' };
    }
  }

  // Carousel videos
  async listVideos(): Promise<HealingServiceResponse<HealingVideo[]>> {
    try {
      const response = await fetch('/api/healing/carousel-videos');
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to fetch videos' };
      return { data: result.data || [] };
    } catch (error) {
      return { error: 'Failed to fetch carousel videos' };
    }
  }

  async createVideo(payload: {
    type: HealingPart;
    youtube_url: string;
    video_title?: string;
    video_description?: string;
    video_order?: number;
  }): Promise<HealingServiceResponse<HealingVideo>> {
    try {
      const carousel_number = payload.type === 'part1' ? 1 : 2;
      const response = await fetch('/api/healing/carousel-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carousel_number,
          youtube_url: payload.youtube_url,
          video_title: payload.video_title,
          video_description: payload.video_description,
          video_order: payload.video_order || 1,
        }),
      });
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to create video' };
      return { data: result.data };
    } catch (error) {
      return { error: 'Failed to create carousel video' };
    }
  }

  async updateVideo(id: string, patch: Partial<{ youtube_url: string; video_order: number; type: HealingPart }>): Promise<HealingServiceResponse<boolean>> {
    try {
      const updatePayload: any = {};
      if (patch.youtube_url) updatePayload.youtube_url = patch.youtube_url;
      if (patch.video_order) updatePayload.video_order = patch.video_order;
      if (patch.type) updatePayload.carousel_number = patch.type === 'part1' ? 1 : 2;

      const response = await fetch(`/api/healing/carousel-videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to update video' };
      return { data: true };
    } catch (error) {
      return { error: 'Failed to update carousel video' };
    }
  }

  async deleteVideo(id: string): Promise<HealingServiceResponse<boolean>> {
    try {
      const response = await fetch(`/api/healing/carousel-videos/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Failed to delete video' };
      return { data: true };
    } catch (error) {
      return { error: 'Failed to delete carousel video' };
    }
  }

  // Legacy method for backward compatibility
  async updateCarouselHeader(input: { type: 'part1' | 'part2'; title: string; description: string; is_active?: boolean }): Promise<boolean> {
    const result = await this.updateHeader(input);
    return !result.error;
  }
  // Products
  async get_healing_products(): Promise<HealingServiceResponse<HealingProductRow[]>> {
    try {
      const response = await fetch('/api/healing/products');
      if (!response.ok) {
        return { error: `Failed to fetch healing products: ${response.statusText}` };
      }
      const data = await response.json();
      return { data: data.data || [] };
    } catch (error) {
      console.error('Error fetching healing products:', error);
      return { error: 'Failed to fetch healing products' };
    }
  }

  async get_healing_product_by_id(id: string): Promise<HealingServiceResponse<HealingProductRow | null>> {
    try {
      const response = await fetch(`/api/healing/products/${id}`);
      if (response.status === 404) {
        return { data: null };
      }
      if (!response.ok) {
        return { error: `Failed to fetch healing product: ${response.statusText}` };
      }
      const data = await response.json();
      return { data: data.data };
    } catch (error) {
      console.error('Error fetching healing product:', error);
      return { error: 'Failed to fetch healing product' };
    }
  }

  async create_healing_product(input: HealingProductInsert): Promise<HealingServiceResponse<HealingProductRow>> {
    try {
      const response = await fetch('/api/healing/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_title: input.product_title,
          product_purpose: input.product_purpose || null,
          how_to_use: input.how_to_use || null,
          product_image_path: input.product_image_path || null,
          amazon_url: input.amazon_url || null,
          is_active: input.is_active || null,
          product_order: input.product_order || null,
          status: input.status || 'draft'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { error: error?.error || 'Failed to create healing product' };
      }

      const data = await response.json();
      return { data: data.data };
    } catch (error) {
      console.error('Error creating healing product:', error);
      return { error: 'Failed to create healing product' };
    }
  }

  async update_healing_product(id: string, input: HealingProductUpdate): Promise<HealingServiceResponse<HealingProductRow>> {
    try {
      const response = await fetch(`/api/healing/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { error: error?.error || 'Failed to update healing product' };
      }

      const data = await response.json();
      return { data: data.data };
    } catch (error) {
      console.error('Error updating healing product:', error);
      return { error: 'Failed to update healing product' };
    }
  }

  async delete_healing_product(id: string): Promise<HealingServiceResponse<void>> {
    try {
      const response = await fetch(`/api/healing/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { error: error?.error || 'Failed to delete healing product' };
      }

      return { data: undefined };
    } catch (error) {
      console.error('Error deleting healing product:', error);
      return { error: 'Failed to delete healing product' };
    }
  }


  // Featured video (healing_page_content)
  async get_featured_video(): Promise<HealingServiceResponse<HealingPageContentRow | null>> {
    try {
      const response = await fetch('/api/healing/featured-video');
      if (response.status === 404) {
        return { data: null };
      }
      if (!response.ok) {
        return { error: `Failed to fetch featured video: ${response.statusText}` };
      }
      const data = await response.json();
      return { data: data.data };
    } catch (error) {
      console.error('Error fetching featured video:', error);
      return { error: 'Failed to fetch featured video' };
    }
  }

  async upsert_featured_video(input: {
    hero_video_title?: string;
    hero_video_subtitle?: string;
    hero_video_date?: string;
    hero_video_youtube_url?: string;
  }): Promise<HealingServiceResponse<HealingPageContentRow>> {
    try {
      const response = await fetch('/api/healing/featured-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_video_title: input.hero_video_title || null,
          hero_video_subtitle: input.hero_video_subtitle || null,
          hero_video_date: input.hero_video_date || null,
          hero_video_youtube_url: input.hero_video_youtube_url || null
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        return { error: error?.error || 'Failed to update featured video' };
      }

      const data = await response.json();
      return { data: data.data };
    } catch (error) {
      console.error('Error updating featured video:', error);
      return { error: 'Failed to update featured video' };
    }
  }

  // Legacy method support for existing code
  async getHealingProducts(): Promise<HealingProductRow[]> {
    const result = await this.get_healing_products();
    if (result.error) throw new Error(result.error);
    return result.data || [];
  }

  async getHealingProductById(id: string): Promise<HealingProductRow | null> {
    const result = await this.get_healing_product_by_id(id);
    if (result.error) throw new Error(result.error);
    return result.data || null;
  }

  async createHealingProduct(input: HealingProductInsert): Promise<HealingProductRow> {
    const result = await this.create_healing_product(input);
    if (result.error) throw new Error(result.error);
    return result.data!;
  }

  async updateHealingProduct(id: string, input: HealingProductUpdate): Promise<HealingProductRow> {
    const result = await this.update_healing_product(id, input);
    if (result.error) throw new Error(result.error);
    return result.data!;
  }

  async deleteHealingProduct(id: string): Promise<void> {
    const result = await this.delete_healing_product(id);
    if (result.error) throw new Error(result.error);
  }

  async getHealingCarouselVideos(): Promise<HealingVideo[]> {
    const result = await this.listVideos();
    if (result.error) throw new Error(result.error);
    return result.data || [];
  }

  async createHealingCarouselVideo(input: { carousel_number: number; youtube_url: string; video_title: string; video_description?: string; video_order?: number }): Promise<HealingVideo> {
    const type: HealingPart = input.carousel_number === 1 ? 'part1' : 'part2';
    const result = await this.createVideo({
      type,
      youtube_url: input.youtube_url,
      video_title: input.video_title,
      video_description: input.video_description,
      video_order: input.video_order
    });
    if (result.error) throw new Error(result.error);
    return result.data!;
  }

  async updateHealingCarouselVideo(id: string, input: { carousel_number?: number; youtube_url?: string; video_order?: number }): Promise<HealingVideo> {
    const patch: Partial<{ youtube_url: string; video_order: number; type: HealingPart }> = {};
    if (input.youtube_url) patch.youtube_url = input.youtube_url;
    if (input.video_order) patch.video_order = input.video_order;
    if (input.carousel_number) patch.type = input.carousel_number === 1 ? 'part1' : 'part2';

    const result = await this.updateVideo(id, patch);
    if (result.error) throw new Error(result.error);

    // Return updated video from list
    const videos = await this.listVideos();
    if (videos.error) throw new Error(videos.error);
    const updated = (videos.data || []).find(v => v.id === id);
    if (!updated) throw new Error('Updated video not found');
    return updated;
  }

  async deleteHealingCarouselVideo(id: string): Promise<void> {
    const result = await this.deleteVideo(id);
    if (result.error) throw new Error(result.error);
  }

  // Additional legacy methods
  async getAllProducts(): Promise<HealingProductRow[]> {
    return this.getHealingProducts();
  }

  async getAllVideos(): Promise<HealingVideo[]> {
    return this.getHealingCarouselVideos();
  }


  async deleteProduct(id: string): Promise<void> {
    return this.deleteHealingProduct(id);
  }
}

export const healingService = new HealingService();
export default healingService;