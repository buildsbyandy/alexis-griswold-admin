/**
 * REFACTORED: Healing products [id] API with full snake_case alignment
 * - Removed camelCase field mappings (name->product_title, isActive->is_active, etc.)
 * - All inputs/outputs use proper snake_case schema fields
 * - Uses Supabase-generated types for type safety
 * - Returns { data } or { error } with proper status codes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import type { Database } from '@/types/supabase.generated';

type HealingProductRow = Database['public']['Tables']['healing_products']['Row'];
type HealingProductUpdate = Database['public']['Tables']['healing_products']['Update'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('healing_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching healing product:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Healing product not found' });
        }
        return res.status(500).json({ error: 'Failed to fetch healing product' });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching healing product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Authentication required for PUT and DELETE
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      // Use snake_case fields directly from request body
      const updateData: HealingProductUpdate = {
        product_title: req.body.product_title,
        product_purpose: req.body.product_purpose,
        how_to_use: req.body.how_to_use,
        product_image_path: req.body.product_image_path,
        amazon_url: req.body.amazon_url,
        is_active: req.body.is_active,
        product_order: req.body.product_order,
        status: req.body.status,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabaseAdmin
        .from('healing_products')
        .update(cleanUpdateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error updating healing product:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Healing product not found' });
        }
        return res.status(500).json({ error: 'Failed to update healing product' });
      }

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error updating healing product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('healing_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting healing product:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Healing product not found' });
        }
        return res.status(500).json({ error: 'Failed to delete healing product' });
      }

      return res.status(200).json({ data: { success: true } });
    } catch (error) {
      console.error('Error deleting healing product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}