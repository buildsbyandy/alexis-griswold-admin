/**
 * Healing featured videos API
 * - Gets videos marked as featured from carousel_items
 * - Similar to vlogs featured video functionality
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import { youtubeService } from '../../../lib/services/youtubeService';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch featured healing videos from carousel_items
      const { data: featuredVideos, error } = await supabaseAdmin
        .from('carousel_items')
        .select(`
          *,
          carousels!inner(page, slug)
        `)
        .eq('carousels.page', 'healing')
        .eq('kind', 'video')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching featured healing videos:', error);
        return res.status(500).json({ error: 'Failed to fetch featured videos' });
      }

      // Normalize to UI shape expected
      const normalized = await Promise.all((featuredVideos || []).map(async (item) => {
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
          carousel_id: item.carousel_id,
          youtube_url: url,
          youtube_id: youtubeId,
          video_title: title,
          video_description: description || null,
          video_order: item.order_index || 1,
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          // extra fields for UI convenience
          carousel: item.carousels?.slug === 'healing-part-1' ? 'part1' : 'part2',
          isActive: item.is_active ?? true,
          order: item.order_index || 1,
          is_featured: true,
        };
      }));

      return res.status(200).json({ data: normalized });
    } catch (error) {
      console.error('Error in healing featured videos GET:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
