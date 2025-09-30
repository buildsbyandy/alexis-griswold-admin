import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';
import { z } from 'zod';
import type { Database } from '@/types/supabase.generated';
type CategoryInsert = Database['public']['Tables']['storefront_categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['storefront_categories']['Update'];

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all storefront categories
      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching storefront categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      return res.status(200).json({ categories: data || [] });
    } catch (error) {
      console.error('Error in categories GET:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Create new category
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const BodySchema = z.object({
        category_name: z.string().trim().min(1).max(100),
        slug: z.string().trim().min(1).max(100),
        category_description: z.string().trim().max(1000).optional(),
        category_image_path: z.string().trim().optional(),
        // is_featured: z.boolean().optional(), // Now handled by carousel system
        is_visible: z.boolean().optional(),
        sort_order: z.number().int().min(0).optional(),
      });
      const parsed = BodySchema.parse(req.body);

      const insertData: CategoryInsert = {
        category_name: parsed.category_name,
        slug: parsed.slug,
        category_description: parsed.category_description ?? null,
        category_image_path: parsed.category_image_path ?? null,
        // is_featured field removed - featured status now handled by carousel system
        is_visible: parsed.is_visible ?? true,
        sort_order: parsed.sort_order ?? undefined,
      };

      if (insertData.sort_order === undefined) {
        const { data: lastCategory } = await supabaseAdmin
          .from('storefront_categories')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();
        insertData.sort_order = (lastCategory?.sort_order ?? 0) + 1;
      }

      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating category:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'A category with this name or slug already exists' });
        }
        return res.status(500).json({ error: 'Failed to create category' });
      }

      return res.status(201).json({ category: data });
    } catch (error) {
      console.error('Error in categories POST:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    // Update category
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      const BodySchema = z.object({
        category_name: z.string().trim().min(1).max(100).optional(),
        slug: z.string().trim().min(1).max(100).optional(),
        category_description: z.string().trim().max(1000).nullable().optional(),
        category_image_path: z.string().trim().nullable().optional(),
        // is_featured: z.boolean().nullable().optional(), // Now handled by carousel system
        is_visible: z.boolean().nullable().optional(),
        sort_order: z.number().int().min(0).nullable().optional(),
      });
      const parsed = BodySchema.parse(updates);
      const updateData: CategoryUpdate = Object.fromEntries(
        Object.entries(parsed).filter(([_, value]) => value !== undefined)
      ) as CategoryUpdate;

      (updateData as any).updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating category:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Category not found' });
        }
        if (error.code === '23505') {
          return res.status(400).json({ error: 'A category with this name or slug already exists' });
        }
        return res.status(500).json({ error: 'Failed to update category' });
      }

      return res.status(200).json({ category: data });
    } catch (error) {
      console.error('Error in categories PUT:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete category
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      // Check if category has products (check by slug since that's the foreign key)
      const { data: categoryToDelete } = await supabaseAdmin
        .from('storefront_categories')
        .select('slug')
        .eq('id', id)
        .single();

      if (!categoryToDelete) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const { data: products, error: productsError } = await supabaseAdmin
        .from('storefront_products')
        .select('id')
        .eq('category_slug', categoryToDelete.slug)
        .is('deleted_at', null) // Only check non-deleted products
        .limit(1);

      if (productsError) {
        console.error('Error checking for products:', productsError);
        return res.status(500).json({ error: 'Failed to check for existing products' });
      }

      if (products && products.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete category with existing products. Move or delete products first.'
        });
      }

      const { error } = await supabaseAdmin
        .from('storefront_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(500).json({ error: 'Failed to delete category' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in categories DELETE:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}