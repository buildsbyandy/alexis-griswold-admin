/**
 * API endpoint for individual recipe folder
 * Handles PUT and DELETE operations
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

type RecipeFolderUpdate = Database['public']['Tables']['recipe_folders']['Update'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication required for all operations
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid folder ID' });
  }

  if (req.method === 'PUT') {
    try {
      const folderData: RecipeFolderUpdate = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        is_visible: req.body.is_visible,
        sort_order: req.body.sort_order,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      const cleanFolderData = Object.fromEntries(
        Object.entries(folderData).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabaseAdmin
        .from('recipe_folders')
        .update(cleanFolderData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error updating recipe folder:', error);
        return res.status(500).json({ error: 'Failed to update recipe folder' });
      }

      return res.status(200).json({ folder: data });
    } catch (error) {
      console.error('Error updating recipe folder:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('recipe_folders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting recipe folder:', error);
        return res.status(500).json({ error: 'Failed to delete recipe folder' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting recipe folder:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
