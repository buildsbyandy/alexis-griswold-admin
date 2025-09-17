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
  listViewItems,
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
} from '../../../lib/services/carouselService';

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
      // Fetch all healing items (both slugs), then filter kind='video'
      const result = await listViewItems('healing');
      if (result.error) return res.status(500).json({ error: result.error });
      const items = (result.data || []).filter(i => i?.kind === 'video' && (i.carousel_slug === HEALING_SLUGS[1] || i.carousel_slug === HEALING_SLUGS[2]));

      // Normalize to UI shape expected (legacy fields)
      const normalized = await Promise.all(items.map(async (item) => {
        const youtubeId = item.youtube_id || '';
        const url = youtubeService.format_youtube_url(youtubeId).data || '';
        let title = item.caption || '';
        let description = '';
        const meta = await youtubeService.get_video_data(youtubeId);
        if (meta.data) {
          title = title || meta.data.title;
          description = meta.data.description;
        }
        return {
          id: item.id!,
          carousel_id: null,
          youtube_url: url,
          youtube_id: youtubeId,
          video_title: title,
          video_description: description || null,
          video_order: item.order_index || 1,
          created_at: '',
          updated_at: '',
          // extra fields for UI convenience (ignored by types)
          carousel: item.carousel_slug === HEALING_SLUGS[1] ? 'part1' : 'part2',
          isActive: item.is_active ?? true,
          order: item.order_index || 1,
        };
      }));

      // Sort by part then order to mimic previous behavior
      normalized.sort((a, b) => (a.carousel === 'part1' ? 0 : 1) - (b.carousel === 'part1' ? 0 : 1) || a.video_order - b.video_order);
      return res.status(200).json({ data: normalized });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { carousel_number, youtube_url, video_title, video_description, video_order } = req.body as {
        carousel_number?: 1 | 2;
        youtube_url?: string;
        video_title?: string;
        video_description?: string;
        video_order?: number;
      };

      if (!youtube_url) return res.status(400).json({ error: 'youtube_url is required' });
      if (!carousel_number || (carousel_number !== 1 && carousel_number !== 2)) return res.status(400).json({ error: 'carousel_number must be 1 or 2' });

      const urlValidation = youtubeService.validate_youtube_url(youtube_url);
      if (urlValidation.error) return res.status(400).json({ error: urlValidation.error });

      const idRes = youtubeService.extract_video_id(youtube_url);
      if (idRes.error) return res.status(400).json({ error: idRes.error });
      const youtube_id = idRes.data!;

      const requestedOrder = video_order || 1;
      if (requestedOrder < 1 || requestedOrder > 5) return res.status(400).json({ error: 'video_order must be between 1 and 5' });

      // Resolve target carousel by slug (create if missing)
      const slug = HEALING_SLUGS[carousel_number];
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
        return res.status(409).json({ error: `Video order ${requestedOrder} is already taken in carousel ${carousel_number}. Please choose a different order (1-5).` });
      }

      // Determine caption (short) and derive metadata for response
      let caption = video_title || '';
      if (!caption) {
        const meta = await youtubeService.get_video_data(youtube_id);
        if (meta.data) caption = meta.data.title;
      }

      const insertRes = await createCarouselItem({
        carousel_id: carousel.data!.id,
        kind: 'video',
        order_index: requestedOrder,
        youtube_id,
        caption: caption || null,
        is_active: true,
      });
      if (insertRes.error) return res.status(500).json({ error: insertRes.error });

      // Build normalized response
      const meta = await youtubeService.get_video_data(youtube_id);
      const url = youtubeService.format_youtube_url(youtube_id).data || youtube_url;
      const response = {
        id: insertRes.data!.id,
        carousel_id: carousel.data!.id,
        youtube_url: url,
        youtube_id,
        video_title: caption || meta.data?.title || 'Untitled Video',
        video_description: video_description || meta.data?.description || null,
        video_order: requestedOrder,
        created_at: insertRes.data!.created_at,
        updated_at: insertRes.data!.updated_at,
        carousel: carousel_number === 1 ? 'part1' : 'part2',
        isActive: insertRes.data!.is_active,
        order: requestedOrder,
      };

      return res.status(201).json({ data: response });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}