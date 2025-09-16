import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // All operations require admin authentication
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null) // Exclude soft-deleted products
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Product not found' });
        }
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: 'Failed to fetch product' });
      }

      return res.status(200).json({ product: data });
    } catch (error) {
      console.error('Error fetching storefront product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Remove undefined fields from the update
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== undefined)
      );

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      // Handle slug regeneration if product_title changed but slug wasn't provided
      if (updateData.product_title && !updateData.slug) {
        // Get current product to check if product_title changed
        const { data: currentProduct } = await supabaseAdmin
          .from('storefront_products')
          .select('product_title, slug')
          .eq('id', id)
          .single();

        if (currentProduct && currentProduct.product_title !== updateData.product_title) {
          updateData.slug = updateData.product_title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        }
      }

      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .update(updateData)
        .eq('id', id)
        .is('deleted_at', null) // Only update non-deleted products
        .select('*')
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Product not found' });
        }
        if (error.code === '23505') {
          return res.status(400).json({ error: 'A product with this slug already exists' });
        }
        if (error.code === '23503') {
          return res.status(400).json({ error: 'Invalid category slug' });
        }
        return res.status(500).json({ error: 'Failed to update product' });
      }

      return res.status(200).json({ product: data });
    } catch (error) {
      console.error('Error updating storefront product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Perform soft delete by setting deleted_at timestamp
      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .is('deleted_at', null) // Only delete non-deleted products
        .select('id')
        .single();

      if (error) {
        console.error('Supabase delete error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(500).json({ error: 'Failed to delete product' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting storefront product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}