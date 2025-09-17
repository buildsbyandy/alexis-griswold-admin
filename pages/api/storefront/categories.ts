import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';

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
      // Validate required fields
      const { category_name, slug } = req.body;
      if (!category_name || !slug) {
        return res.status(400).json({ error: 'Category name and slug are required' });
      }

      // Remove undefined fields from the insert data
      const insertData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== undefined)
      );

      // Ensure defaults for optional fields
      if (insertData.is_featured === undefined) insertData.is_featured = false;
      if (insertData.is_visible === undefined) insertData.is_visible = true;
      if (insertData.sort_order === undefined) {
        // Auto-assign next sort order
        const { data: lastCategory } = await supabaseAdmin
          .from('storefront_categories')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        insertData.sort_order = lastCategory?.sort_order ? lastCategory.sort_order + 1 : 1;
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
      // Remove undefined fields from the update data
      const updateData = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

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