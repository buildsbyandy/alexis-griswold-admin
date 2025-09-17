/**
 * REFACTORED: Healing featured video API with full snake_case alignment
 * - Removed camelCase field mappings (video_url->hero_video_youtube_url, etc.)
 * - All inputs/outputs use proper snake_case schema fields
 * - Uses Supabase-generated types for type safety
 * - Returns { data } or { error } with proper status codes
 * - Handles upsert logic for healing_page_content singleton
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

type HealingPageContentRow = Database['public']['Tables']['healing_page_content']['Row'];
type HealingPageContentInsert = Database['public']['Tables']['healing_page_content']['Insert'];
type HealingPageContentUpdate = Database['public']['Tables']['healing_page_content']['Update'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('healing_page_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Supabase error fetching featured video:', error);
        if (error.code === 'PGRST116') {
          // No record found - return null data instead of error
          return res.status(200).json({ data: null });
        }
        return res.status(500).json({ error: 'Failed to fetch healing featured video' });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching healing featured video:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Authentication required for PUT
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      // Use snake_case fields directly from request body
      const videoData: HealingPageContentUpdate = {
        hero_video_youtube_url: req.body.hero_video_youtube_url,
        hero_video_title: req.body.hero_video_title,
        hero_video_subtitle: req.body.hero_video_subtitle,
        hero_video_date: req.body.hero_video_date,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      const cleanVideoData = Object.fromEntries(
        Object.entries(videoData).filter(([_, value]) => value !== undefined)
      );

      // Get existing record to determine if we should update or insert
      const { data: existing } = await supabaseAdmin
        .from('healing_page_content')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existing) {
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from('healing_page_content')
          .update(cleanVideoData)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase error updating featured video:', error);
          return res.status(500).json({ error: 'Failed to update featured video' });
        }
        result = data;
      } else {
        // Create new record
        const insertData: HealingPageContentInsert = {
          ...cleanVideoData
        };

        const { data, error } = await supabaseAdmin
          .from('healing_page_content')
          .insert(insertData)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase error creating featured video:', error);
          return res.status(500).json({ error: 'Failed to create featured video' });
        }
        result = data;
      }

      return res.status(200).json({ data: result });
    } catch (error) {
      console.error('Error updating healing featured video:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT');
  return res.status(405).json({ error: 'Method Not Allowed' });
}