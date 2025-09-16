import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import supabaseAdmin from '@/lib/supabase';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Parse query parameters for filtering and searching
      const {
        query,
        category_slug,
        status,
        is_alexis_pick,
        is_favorite,
        show_in_favorites,
        limit,
        offset,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      let supabaseQuery = supabaseAdmin
        .from('storefront_products')
        .select('*')
        .is('deleted_at', null); // Exclude soft-deleted products

      // Apply filters
      if (query && typeof query === 'string') {
        supabaseQuery = supabaseQuery.or(`product_title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (category_slug && typeof category_slug === 'string') {
        supabaseQuery = supabaseQuery.eq('category_slug', category_slug);
      }

      if (status && typeof status === 'string') {
        supabaseQuery = supabaseQuery.eq('status', status);
      }

      if (is_alexis_pick !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_alexis_pick', is_alexis_pick === 'true');
      }

      if (is_favorite !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_favorite', is_favorite === 'true');
      }

      if (show_in_favorites !== undefined) {
        supabaseQuery = supabaseQuery.eq('show_in_favorites', show_in_favorites === 'true');
      }

      // Apply sorting
      if (typeof sortBy === 'string' && ['created_at', 'product_title', 'click_count', 'clicks_30d', 'sort_weight'].includes(sortBy)) {
        const ascending = sortOrder === 'asc';
        supabaseQuery = supabaseQuery.order(sortBy, { ascending });
      }

      // Apply pagination
      if (limit && typeof limit === 'string') {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          supabaseQuery = supabaseQuery.limit(limitNum);
        }
      }

      if (offset && typeof offset === 'string') {
        const offsetNum = parseInt(offset, 10);
        if (!isNaN(offsetNum) && offsetNum >= 0) {
          supabaseQuery = supabaseQuery.range(offsetNum, offsetNum + (limit ? parseInt(limit as string, 10) - 1 : 49));
        }
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Supabase query error:', error);
        return res.status(500).json({ error: 'Failed to fetch storefront products' });
      }

      return res.status(200).json({ products: data || [] });
    } catch (error) {
      console.error('Error fetching storefront products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Create new product - requires authentication
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Validate required fields
      const { product_title, amazon_url } = req.body;
      if (!product_title || !amazon_url) {
        return res.status(400).json({ error: 'Product title and Amazon URL are required' });
      }

      // Remove undefined fields and prepare the insert data
      const insertData = Object.fromEntries(
        Object.entries(req.body).filter(([_, value]) => value !== undefined)
      );

      // Ensure required fields have proper defaults
      if (!insertData.status) {
        insertData.status = 'draft';
      }

      // Handle slug generation if not provided
      if (!insertData.slug && insertData.product_title) {
        insertData.slug = insertData.product_title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        if (error.code === '23505') {
          return res.status(400).json({ error: 'A product with this slug already exists' });
        }
        if (error.code === '23503') {
          return res.status(400).json({ error: 'Invalid category slug' });
        }
        return res.status(500).json({ error: 'Failed to create product' });
      }

      return res.status(201).json({ product: data });
    } catch (error) {
      console.error('Error creating storefront product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}