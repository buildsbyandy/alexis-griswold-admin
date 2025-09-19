/**
 * Healing carousel item [id] API (unified schema)
 * - Updates/deletes items in carousel_items for healing (kind='video')
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import { youtubeService } from '../../../../lib/services/youtubeService';
import {
  updateCarouselItem,
  deleteCarouselItem,
  findCarouselByPageSlug,
  getCarouselItems,
} from '../../../../lib/services/carouselService';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // All methods require admin authentication
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  if (req.method === 'PUT') {
    try {
      const { youtube_url, video_order, carousel_number, is_featured } = req.body as {
        youtube_url?: string;
        video_order?: number;
        carousel_number?: 1 | 2;
        is_featured?: boolean;
      };

      const updatePayload: any = {};

      if (youtube_url !== undefined) {
        const idRes = youtubeService.extract_video_id(youtube_url);
        if (idRes.error) return res.status(400).json({ error: idRes.error });
        updatePayload.youtube_id = idRes.data;
      }

      if (video_order !== undefined) {
        if (video_order < 1 || video_order > 5) return res.status(400).json({ error: 'video_order must be between 1 and 5' });
        updatePayload.order_index = video_order;
      }

      if (carousel_number !== undefined) {
        if (carousel_number < 1 || carousel_number > 2) return res.status(400).json({ error: 'carousel_number must be 1 or 2' });
        const slug = carousel_number === 1 ? 'healing-part-1' : 'healing-part-2';
        const target = await findCarouselByPageSlug('healing', slug);
        if (target.error || !target.data) return res.status(404).json({ error: target.error || 'Target carousel not found' });

        // Ensure requested order unique within new carousel
        if (updatePayload.order_index !== undefined) {
          const items = await getCarouselItems(target.data.id);
          if (items.error) return res.status(500).json({ error: items.error });
          if ((items.data || []).some(i => i.order_index === updatePayload.order_index && i.id !== id)) {
            return res.status(409).json({ error: `Video order ${updatePayload.order_index} is already taken in this carousel.` });
          }
        }

        updatePayload.carousel_id = target.data.id;
      }

      if (is_featured !== undefined) {
        updatePayload.is_featured = is_featured;
      }

      updatePayload.updated_at = new Date().toISOString();

      const updated = await updateCarouselItem(id, updatePayload);
      if (updated.error) return res.status(500).json({ error: updated.error });
      return res.status(200).json({ data: updated.data });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteCarouselItem(id);
      if (deleted.error) return res.status(500).json({ error: deleted.error });
      return res.status(200).json({ data: { success: true } });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}