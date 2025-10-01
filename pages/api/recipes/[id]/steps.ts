/**
 * API endpoint for recipe_steps
 * Handles GET and PUT operations for recipe steps
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

type RecipeStepRow = Database['public']['Tables']['recipe_steps']['Row'];
type RecipeStepInsert = Database['public']['Tables']['recipe_steps']['Insert'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid recipe ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', id)
        .order('step_order', { ascending: true });

      if (error) {
        console.error('Supabase error fetching recipe steps:', error);
        return res.status(500).json({ error: 'Failed to fetch recipe steps' });
      }

      return res.status(200).json({ steps: data });
    } catch (error) {
      console.error('Error fetching recipe steps:', error);
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
      const { steps } = req.body;

      if (!Array.isArray(steps)) {
        return res.status(400).json({ error: 'Steps must be an array' });
      }

      // Delete all existing steps for this recipe
      const { error: deleteError } = await supabaseAdmin
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) {
        console.error('Error deleting existing steps:', deleteError);
        return res.status(500).json({ error: 'Failed to delete existing steps' });
      }

      // Insert new steps if any
      if (steps.length > 0) {
        const stepsToInsert: RecipeStepInsert[] = steps.map((step, index) => ({
          recipe_id: id,
          step_order: step.step_order ?? index,
          image_path: step.image_path || null,
          description: step.description || null,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('recipe_steps')
          .insert(stepsToInsert);

        if (insertError) {
          console.error('Error inserting recipe steps:', insertError);
          return res.status(500).json({ error: 'Failed to insert recipe steps' });
        }
      }

      // Fetch and return the updated steps
      const { data, error } = await supabaseAdmin
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', id)
        .order('step_order', { ascending: true });

      if (error) {
        console.error('Error fetching updated steps:', error);
        return res.status(500).json({ error: 'Failed to fetch updated steps' });
      }

      return res.status(200).json({ steps: data });
    } catch (error) {
      console.error('Error updating recipe steps:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
