/**
 * Healing carousel videos API (unified schema)
 * - Uses carousels + carousel_items with kind='video'
 * - Returns normalized payload to match existing UI contract
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import { youtubeService } from '../../../lib/services/youtubeService';
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
} from '../../../lib/services/carouselService';
import supabaseAdmin from '../../../lib/supabase';

export const config = { runtime: 'nodejs' };

const HEALING_SLUGS: Record<1 | 2, string> = { 1: 'healing-part-1', 2: 'healing-part-2' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // All methods require admin authentication
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch healing carousel items directly from database (excluding featured videos)
      const { data: carouselItems, error: itemsError } = await supabaseAdmin
        .from('carousel_items')
        .select(`
          *,
          carousels!inner(page, slug)
        `)
        .eq('carousels.page', 'healing')
        .eq('kind', 'video')
        .in('carousels.slug', [HEALING_SLUGS[1], HEALING_SLUGS[2]])
        // Note: All carousel videos are regular videos (featured videos managed separately)
        .eq('is_active', true) // Only return active items for public consumption
        .order('order_index', { ascending: true });

      if (itemsError) {
        console.error('Error fetching healing carousel items:', itemsError);
        return res.status(500).json({ error: 'Failed to fetch healing carousel items' });
      }

      // Return raw carousel_items data directly (no normalization)
      const items = await Promise.all((carouselItems || []).map(async (item) => {
        const youtubeId = item.youtube_id || '';
        const url = youtubeService.format_youtube_url(youtubeId).data || '';
        let caption = item.caption || '';
        let description = '';
        const meta = await youtubeService.get_video_data(youtubeId);
        if (meta.data) {
          caption = caption || meta.data.title;
          description = meta.data.description;
        }
        return {
          id: item.id!,
          carousel_id: item.carousel_id,
          link_url: url,
          youtube_id: youtubeId,
          caption: caption,
          video_description: description || null,
          order_index: item.order_index || 1,
          is_active: item.is_active ?? true,
          // Legacy fields removed - featured status managed by carousel system
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          // UI convenience fields
          carousel: item.carousels?.slug === HEALING_SLUGS[1] ? 'part1' : 'part2',
        };
      }));

      // Sort by carousel then order
      items.sort((a, b) => (a.carousel === 'part1' ? 0 : 1) - (b.carousel === 'part1' ? 0 : 1) || a.order_index - b.order_index);
      return res.status(200).json({ data: items });
    } catch (error) {
      console.error('Error in healing carousel videos GET:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { carousel_slug, youtube_url, link_url, caption, video_description, order_index } = req.body as {
        carousel_slug?: string;
        youtube_url?: string;
        link_url?: string;
        caption?: string;
        video_description?: string;
        order_index?: number;
      };

      const video_url = youtube_url || link_url;
      if (!video_url) return res.status(400).json({ error: 'youtube_url or link_url is required' });
      if (!carousel_slug) return res.status(400).json({ error: 'carousel_slug is required' });
      if (!Object.values(HEALING_SLUGS).includes(carousel_slug)) {
        return res.status(400).json({ error: 'carousel_slug must be healing-part-1 or healing-part-2' });
      }

      const urlValidation = youtubeService.validate_youtube_url(video_url);
      if (urlValidation.error) return res.status(400).json({ error: urlValidation.error });

      const idRes = youtubeService.extract_video_id(video_url);
      if (idRes.error) return res.status(400).json({ error: idRes.error });
      const youtube_id = idRes.data!;

      const requestedOrder = order_index || 1;
      if (requestedOrder < 1 || requestedOrder > 5) return res.status(400).json({ error: 'order_index must be between 1 and 5' });

      // Resolve target carousel by slug (create if missing)
      const slug = carousel_slug;
      let carousel = await findCarouselByPageSlug('healing', slug);
      if (carousel.error) return res.status(500).json({ error: carousel.error });
      if (!carousel.data) {
        const created = await createCarousel({ page: 'healing', slug, title: null, description: null, is_active: true });
        if (created.error) return res.status(500).json({ error: created.error });
        carousel = { data: created.data };
      }

      // Enforce order uniqueness
      const itemsRes = await getCarouselItems(carousel.data!.id);
      if (itemsRes.error) return res.status(500).json({ error: itemsRes.error });
      if ((itemsRes.data || []).some(i => (i.order_index || 0) === requestedOrder)) {
        return res.status(409).json({ error: `Order ${requestedOrder} is already taken in this carousel. Please choose a different order (1-5).` });
      }

      // Determine caption (short) and derive metadata for response
      let itemCaption = caption || '';
      if (!itemCaption) {
        const meta = await youtubeService.get_video_data(youtube_id);
        if (meta.data) itemCaption = meta.data.title;
      }

      const insertRes = await createCarouselItem({
        carousel_id: carousel.data!.id,
        kind: 'video',
        order_index: requestedOrder,
        youtube_id,
        caption: itemCaption || null,
        is_active: true,
        // Legacy fields removed - featured status managed by carousel system
      });
      if (insertRes.error) return res.status(500).json({ error: insertRes.error });

      // Build unified response (no normalization)
      const meta = await youtubeService.get_video_data(youtube_id);
      const response = {
        id: insertRes.data!.id,
        carousel_id: carousel.data!.id,
        link_url: video_url,
        youtube_id,
        caption: itemCaption || meta.data?.title || 'Untitled Video',
        video_description: video_description || meta.data?.description || null,
        order_index: requestedOrder,
        is_active: insertRes.data!.is_active,
        // Legacy fields removed - featured status managed by carousel system
        created_at: insertRes.data!.created_at,
        updated_at: insertRes.data!.updated_at,
        carousel: slug === HEALING_SLUGS[1] ? 'part1' : 'part2',
      };

      return res.status(201).json({ data: response });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}