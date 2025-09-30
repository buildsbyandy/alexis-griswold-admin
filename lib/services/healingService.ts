/**
 * REFACTORED: Healing service using unified carousel system
 * - Uses carouselService for all video carousel operations
 * - Clean interface without server-only dependencies
 * - Maintains backward compatibility with existing UI contracts
 * - Client-side safe (no server-only imports)
 */

import type { Database } from '@/types/supabase.generated';
import { getMediaUrl, type ContentStatus as StorageContentStatus } from '@/lib/utils/storageHelpers';
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
  upsertHealingHeader,
} from './carouselService';
import { youtubeService } from './youtubeService';

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
  order_index: number;
  created_at?: string;
  updated_at?: string;
  // UI normalized fields
  carousel?: 'part1' | 'part2';
  isActive?: boolean;
  order?: number;
  // Legacy is_featured field removed - featured status managed by carousel system
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
  // Carousel headers - now using unified carousel system
  async getHeaders(): Promise<HealingServiceResponse<Array<{ type: HealingPart; title: string; description: string; is_active: boolean }>>> {
    try {
      const part1 = await findCarouselByPageSlug('healing', 'healing-part-1');
      const part2 = await findCarouselByPageSlug('healing', 'healing-part-2');

      const headers = [];
      if (part1.data) {
        headers.push({
          type: 'part1' as HealingPart,
          title: part1.data.title || '',
          description: part1.data.description || '',
          is_active: part1.data.is_active ?? true
        });
      }
      if (part2.data) {
        headers.push({
          type: 'part2' as HealingPart,
          title: part2.data.title || '',
          description: part2.data.description || '',
          is_active: part2.data.is_active ?? true
        });
      }

      return { data: headers };
    } catch (error) {
      return { error: 'Failed to fetch carousel headers' };
    }
  }

  async updateHeader(input: HealingHeaderDTO): Promise<HealingServiceResponse<boolean>> {
    try {
      const result = await upsertHealingHeader({
        type: input.type,
        title: input.title,
        description: input.description,
        is_active: input.is_active ?? true,
      });

      if (result.error) return { error: result.error };
      return { data: true };
    } catch (error) {
      return { error: 'Failed to update carousel header' };
    }
  }

  // Carousel videos - now using unified carousel system
  async listVideos(): Promise<HealingServiceResponse<HealingVideo[]>> {
    try {
      const part1 = await findCarouselByPageSlug('healing', 'healing-part-1');
      const part2 = await findCarouselByPageSlug('healing', 'healing-part-2');

      const allVideos: HealingVideo[] = [];

      // Process part1 videos
      if (part1.data) {
        const items = await getCarouselItems(part1.data.id);
        if (items.data) {
          const videos = await Promise.all(items.data
            .filter(item => item.kind === 'video' && item.youtube_id)
            .map(async (item) => {
              const youtube_id = item.youtube_id!;
              const meta = await youtubeService.get_video_data(youtube_id);
              const url = youtubeService.format_youtube_url(youtube_id).data || '';

              return {
                id: item.id,
                carousel_id: item.carousel_id,
                youtube_url: url,
                youtube_id,
                video_title: item.caption || meta.data?.title || '',
                video_description: meta.data?.description || null,
                order_index: item.order_index || 0,
                created_at: item.created_at,
                updated_at: item.updated_at,
                carousel: 'part1' as const,
                isActive: item.is_active,
                order: item.order_index || 0,
                // Legacy is_featured field removed
              } as HealingVideo;
            }));
          allVideos.push(...videos);
        }
      }

      // Process part2 videos
      if (part2.data) {
        const items = await getCarouselItems(part2.data.id);
        if (items.data) {
          const videos = await Promise.all(items.data
            .filter(item => item.kind === 'video' && item.youtube_id)
            .map(async (item) => {
              const youtube_id = item.youtube_id!;
              const meta = await youtubeService.get_video_data(youtube_id);
              const url = youtubeService.format_youtube_url(youtube_id).data || '';

              return {
                id: item.id,
                carousel_id: item.carousel_id,
                youtube_url: url,
                youtube_id,
                video_title: item.caption || meta.data?.title || '',
                video_description: meta.data?.description || null,
                order_index: item.order_index || 0,
                created_at: item.created_at,
                updated_at: item.updated_at,
                carousel: 'part2' as const,
                isActive: item.is_active,
                order: item.order_index || 0,
                // Legacy is_featured field removed
              } as HealingVideo;
            }));
          allVideos.push(...videos);
        }
      }

      return { data: allVideos };
    } catch (error) {
      return { error: 'Failed to fetch carousel videos' };
    }
  }

  async createVideo(payload: {
    type: HealingPart;
    youtube_url: string;
    video_title?: string;
    video_description?: string;
    order_index?: number;
    // Legacy is_featured field removed - featured status managed by carousel system
  }): Promise<HealingServiceResponse<HealingVideo>> {
    try {
      // Extract YouTube ID
      const idRes = youtubeService.extract_video_id(payload.youtube_url);
      if (idRes.error) return { error: idRes.error };
      const youtube_id = idRes.data!;

      // Get or create carousel
      const carouselSlug = payload.type === 'part1' ? 'healing-part-1' : 'healing-part-2';
      let carousel = await findCarouselByPageSlug('healing', carouselSlug);
      if (carousel.error) return { error: carousel.error };

      if (!carousel.data) {
        const created = await createCarousel({
          page: 'healing',
          slug: carouselSlug,
          title: payload.type === 'part1' ? 'Part 1' : 'Part 2',
          is_active: true
        });
        if (created.error) return { error: created.error };
        carousel = { data: created.data };
      }

      // Get video metadata
      const meta = await youtubeService.get_video_data(youtube_id);
      const caption = payload.video_title || meta.data?.title || null;

      // Create carousel item
      const createdItem = await createCarouselItem({
        carousel_id: carousel.data!.id,
        kind: 'video',
        order_index: payload.order_index || 1,
        youtube_id,
        caption,
        is_active: true,
      });

      if (createdItem.error) return { error: createdItem.error };

      // Return formatted video
      const url = youtubeService.format_youtube_url(youtube_id).data || payload.youtube_url;
      const video: HealingVideo = {
        id: createdItem.data!.id,
        carousel_id: createdItem.data!.carousel_id,
        youtube_url: url,
        youtube_id,
        video_title: caption || '',
        video_description: payload.video_description || meta.data?.description || null,
        order_index: payload.order_index || 1,
        created_at: createdItem.data!.created_at,
        updated_at: createdItem.data!.updated_at,
        carousel: payload.type,
        isActive: true,
        order: payload.order_index || 1,
        // Legacy is_featured field removed
      };

      return { data: video };
    } catch (error) {
      return { error: 'Failed to create carousel video' };
    }
  }

  async updateVideo(id: string, patch: Partial<{ youtube_url: string; order_index: number; type: HealingPart }>): Promise<HealingServiceResponse<boolean>> {
    try {
      const updatePayload: any = {};

      // Handle YouTube URL change
      if (patch.youtube_url) {
        const idRes = youtubeService.extract_video_id(patch.youtube_url);
        if (idRes.error) return { error: idRes.error };
        updatePayload.youtube_id = idRes.data;
      }

      // Handle order change
      if (patch.order_index !== undefined) {
        updatePayload.order_index = patch.order_index;
      }

      // Handle carousel type change (move between part1/part2)
      if (patch.type) {
        const carouselSlug = patch.type === 'part1' ? 'healing-part-1' : 'healing-part-2';
        const carousel = await findCarouselByPageSlug('healing', carouselSlug);
        if (carousel.error) return { error: carousel.error };
        if (!carousel.data) return { error: 'Target carousel not found' };
        updatePayload.carousel_id = carousel.data.id;
      }

      // Legacy is_featured field removed - featured status managed by carousel system

      const result = await updateCarouselItem(id, updatePayload);
      if (result.error) return { error: result.error };
      return { data: true };
    } catch (error) {
      return { error: 'Failed to update carousel video' };
    }
  }

  async deleteVideo(id: string): Promise<HealingServiceResponse<boolean>> {
    try {
      const result = await deleteCarouselItem(id);
      if (result.error) return { error: result.error };
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


  // Featured video (now using carousel system)
  async get_featured_video(): Promise<HealingServiceResponse<HealingVideo | null>> {
    try {
      // Use carousel system to get the featured video
      const carousel = await findCarouselByPageSlug('healing', 'healing-featured');
      if (carousel.error || !carousel.data) {
        return { data: null };
      }

      const items = await getCarouselItems(carousel.data.id);
      if (items.error || !items.data || items.data.length === 0) {
        return { data: null };
      }

      // Get the first (and should be only) item from the featured carousel
      const featuredItem = items.data[0];
      if (!featuredItem.youtube_id) {
        return { data: null };
      }

      // Get video metadata and format as HealingVideo
      const meta = await youtubeService.get_video_data(featuredItem.youtube_id);
      const url = youtubeService.format_youtube_url(featuredItem.youtube_id).data || '';

      const featuredVideo: HealingVideo = {
        id: featuredItem.id,
        carousel_id: featuredItem.carousel_id,
        youtube_url: url,
        youtube_id: featuredItem.youtube_id,
        video_title: featuredItem.caption || meta.data?.title || '',
        video_description: meta.data?.description || null,
        order_index: featuredItem.order_index || 0,
        created_at: featuredItem.created_at,
        updated_at: featuredItem.updated_at,
        carousel: 'part1', // Default, though not really applicable for featured
        isActive: featuredItem.is_active,
        order: featuredItem.order_index || 0,
        // Legacy is_featured field removed
      };

      return { data: featuredVideo };
    } catch (error) {
      console.error('Error fetching featured video from carousel:', error);
      return { error: 'Failed to fetch featured video' };
    }
  }

  async set_featured_video(carouselItemId: string): Promise<HealingServiceResponse<boolean>> {
    try {
      // 1. Find the 'healing-featured' carousel
      const carousel = await findCarouselByPageSlug('healing', 'healing-featured');
      if (carousel.error || !carousel.data) {
        return { error: 'Featured carousel not found' };
      }

      // 2. Delete all existing items from the featured carousel to enforce "only one" rule
      const currentItems = await getCarouselItems(carousel.data.id);
      if (currentItems.data && currentItems.data.length > 0) {
        for (const item of currentItems.data) {
          await deleteCarouselItem(item.id);
        }
      }

      // 3. Update the carousel_id of the specified carousel_item to be the featured carousel
      const result = await updateCarouselItem(carouselItemId, {
        carousel_id: carousel.data.id,
        order_index: 0 // Featured video should be first
      });

      if (result.error) {
        return { error: result.error };
      }

      return { data: true };
    } catch (error) {
      console.error('Error setting featured video:', error);
      return { error: 'Failed to set featured video' };
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





  // Additional methods
  async get_all_products(): Promise<HealingProductRow[]> {
    // Use API endpoint to maintain consistency
    try {
      const result = await this.get_healing_products();
      if (result.error) {
        console.error('Error fetching healing products:', result.error);
        return [];
      }
      return result.data || [];
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      return [];
    }
  }

  async get_all_videos(): Promise<HealingVideo[]> {
    const result = await this.listVideos();
    if (result.error) {
      console.error('Error fetching healing videos:', result.error);
      return [];
    }
    return result.data || [];
  }

  // Featured video methods (similar to vlog service)
  // Legacy getFeaturedVideos method removed - featured videos now managed through carousel system
  // Use get_featured_video() for single featured video or carousel system directly

  async getCarouselVideosExcludingFeatured(): Promise<HealingServiceResponse<HealingVideo[]>> {
    // This now uses the updated API that excludes featured videos
    return this.listVideos();
  }

  /**
   * Maps healing product status to content status for bucket selection
   */
  getHealingProductContentStatus(product: HealingProductRow): StorageContentStatus {
    // Healing products use 'is_active' toggle instead of status field
    return product.is_active ? 'published' : 'draft';
  }

  /**
   * Gets the appropriate media URL for healing product images
   */
  async getHealingProductImageUrl(imageUrl: string, product?: HealingProductRow): Promise<string | null> {
    if (!imageUrl) return null;

    // For existing products, determine if we should use signed URLs based on active status
    const forceSignedUrl = product ? !product.is_active : false;
    return await getMediaUrl(imageUrl, forceSignedUrl);
  }

  /**
   * Gets all image URLs for a healing product with proper bucket handling
   */
  async getHealingProductImages(product: HealingProductRow): Promise<{ productImage: string | null; generalImage: string | null }> {
    const productImage = product.product_image_path
      ? await this.getHealingProductImageUrl(product.product_image_path, product)
      : null;

    const generalImage = product.image_path
      ? await this.getHealingProductImageUrl(product.image_path, product)
      : null;

    return { productImage, generalImage };
  }
}

export const healingService = new HealingService();
export default healingService;