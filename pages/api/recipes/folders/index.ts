/**
 * API endpoint for recipe_folders table
 * Handles GET and POST operations
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

type RecipeFolderRow = Database['public']['Tables']['recipe_folders']['Row'];
type RecipeFolderInsert = Database['public']['Tables']['recipe_folders']['Insert'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('recipe_folders')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching recipe folders:', error);
        return res.status(500).json({ error: 'Failed to fetch recipe folders' });
      }

      return res.status(200).json({ folders: data });
    } catch (error) {
      console.error('Error fetching recipe folders:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Authentication required for POST
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const folderData: RecipeFolderInsert = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description || null,
        is_visible: req.body.is_visible ?? true,
        sort_order: req.body.sort_order || null,
      };

      const { data, error } = await supabaseAdmin
        .from('recipe_folders')
        .insert(folderData)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error creating recipe folder:', error);
        return res.status(500).json({ error: 'Failed to create recipe folder' });
      }

      return res.status(201).json({ folder: data });
    } catch (error) {
      console.error('Error creating recipe folder:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
