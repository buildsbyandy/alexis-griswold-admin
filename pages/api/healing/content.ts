/**
 * API endpoint for healing_page_content table
 * Handles GET and PUT operations for the healing hero section
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
        console.error('Supabase error fetching healing content:', error);
        if (error.code === 'PGRST116') {
          // No record found - return default data
          return res.status(200).json({
            data: {
              hero_header: 'HEALING',
              hero_subtitle: 'Your journey to wellness starts here.',
              hero_body_paragraph: 'From gut health to holistic healing, discover natural methods to restore your body\'s balance and vitality.'
            }
          });
        }
        return res.status(500).json({ error: 'Failed to fetch healing content' });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching healing content:', error);
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
      const contentData: HealingPageContentUpdate = {
        hero_header: req.body.hero_header,
        hero_subtitle: req.body.hero_subtitle,
        hero_body_paragraph: req.body.hero_body_paragraph,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      const cleanContentData = Object.fromEntries(
        Object.entries(contentData).filter(([_, value]) => value !== undefined)
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
          .update(cleanContentData)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase error updating healing content:', error);
          return res.status(500).json({ error: 'Failed to update healing content' });
        }
        result = data;
      } else {
        // Create new record
        const insertData: HealingPageContentInsert = {
          ...cleanContentData
        };

        const { data, error } = await supabaseAdmin
          .from('healing_page_content')
          .insert(insertData)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase error creating healing content:', error);
          return res.status(500).json({ error: 'Failed to create healing content' });
        }
        result = data;
      }

      return res.status(200).json({ data: result });
    } catch (error) {
      console.error('Error updating healing content:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
