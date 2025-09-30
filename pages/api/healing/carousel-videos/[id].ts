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
  updateCarouselItemDB,
  deleteCarouselItemDB,
  findCarouselByPageSlugDB,
  getCarouselItemsDB,
} from '../../../../lib/db/carousels';

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
      const { youtube_url, link_url, order_index, carousel_slug } = req.body as {
        youtube_url?: string;
        link_url?: string;
        order_index?: number;
        carousel_slug?: string;
      };

      const updatePayload: any = {};

      const video_url = youtube_url || link_url;
      if (video_url !== undefined) {
        const idRes = youtubeService.extract_video_id(video_url);
        if (idRes.error) return res.status(400).json({ error: idRes.error });
        updatePayload.youtube_id = idRes.data;
        updatePayload.link_url = video_url;
      }

      if (order_index !== undefined) {
        if (order_index < 1 || order_index > 5) return res.status(400).json({ error: 'order_index must be between 1 and 5' });
        updatePayload.order_index = order_index;
      }

      if (carousel_slug !== undefined) {
        const target = await findCarouselByPageSlugDB('healing', carousel_slug);
        if (target.error || !target.data) return res.status(404).json({ error: target.error || 'Target carousel not found' });

        // Ensure requested order unique within new carousel
        if (updatePayload.order_index !== undefined) {
          const items = await getCarouselItemsDB(target.data.id);
          if (items.error) return res.status(500).json({ error: items.error });
          if ((items.data || []).some(i => i.order_index === updatePayload.order_index && i.id !== id)) {
            return res.status(409).json({ error: `Order ${updatePayload.order_index} is already taken in this carousel.` });
          }
        }

        updatePayload.carousel_id = target.data.id;
      }

      updatePayload.updated_at = new Date().toISOString();

      const updated = await updateCarouselItemDB(id, updatePayload);
      if (updated.error) return res.status(500).json({ error: updated.error });
      return res.status(200).json({ data: updated.data });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteCarouselItemDB(id);
      if (deleted.error) return res.status(500).json({ error: deleted.error });
      return res.status(200).json({ data: { success: true } });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}