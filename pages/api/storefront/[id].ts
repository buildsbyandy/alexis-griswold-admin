import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import { z } from 'zod';
import { slugify } from '@/lib/utils/slugify';
import type { StorefrontUpdate, StorefrontRow } from '@/types/supabase.generated';

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
      const BodySchema = z.object({
        // Prefer `name` but support legacy `product_title`. Optional partial updates.
        name: z.string().trim().min(1).max(255).optional(),
        product_title: z.string().trim().min(1).max(255).optional(),
        slug: z.string().trim().min(1).max(255).optional(),
        category_slug: z.string().trim().min(1).max(255).nullable().optional(),
        status: z.enum(['draft','published','archived']).optional(),
        amazon_url: z.string().trim().url().optional(),
        price: z.number().nullable().optional(),
        image_path: z.string().trim().nullable().optional(),
        image_alt: z.string().trim().nullable().optional(),
        description: z.string().trim().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
      });

      const parsed = BodySchema.parse(req.body);

      const updateData: StorefrontUpdate = Object.fromEntries(
        Object.entries(parsed).filter(([_, value]) => value !== undefined)
      ) as StorefrontUpdate;

      // Normalize incoming name/product_title into product_title field if provided.
      const incomingTitle = (parsed.name ?? parsed.product_title);
      if (incomingTitle !== undefined) {
        updateData.product_title = incomingTitle;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      // Get current product for comparison if we might need to regenerate slug
      let currentProduct: Pick<StorefrontRow, 'product_title' | 'slug'> | null = null;
      if ((incomingTitle !== undefined && !parsed.slug) || updateData.slug === undefined) {
        const { data } = await supabaseAdmin
          .from('storefront_products')
          .select('product_title, slug')
          .eq('id', id)
          .single();
        currentProduct = (data as StorefrontRow | null) ? { product_title: data!.product_title, slug: data!.slug } : null;
      }

      // Only regenerate slug if title changed AND a slug was not explicitly provided
      if (incomingTitle !== undefined && !parsed.slug && currentProduct && currentProduct.product_title !== incomingTitle) {
        updateData.slug = slugify(incomingTitle);
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