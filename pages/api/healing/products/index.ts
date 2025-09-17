/**
 * REFACTORED: Healing products API with full snake_case alignment
 * - Removed camelCase field mappings (name->product_title, isActive->is_active, etc.)
 * - All inputs/outputs use proper snake_case schema fields
 * - Uses Supabase-generated types for type safety
 * - Returns { data } or { error } with proper status codes
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import isAdminEmail from '../../../../lib/auth/isAdminEmail';
import healingService from '../../../../lib/services/healingService';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const result = await healingService.get_healing_products();
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      return res.status(200).json({ data: result.data || [] });
    } catch (error) {
      console.error('Error fetching healing products:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Authentication required for creating products
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Validate required fields
      const { product_title } = req.body;
      if (!product_title || typeof product_title !== 'string' || !product_title.trim()) {
        return res.status(400).json({ error: 'product_title is required' });
      }

      // Delegate to healingService for product creation
      const result = await healingService.create_healing_product(req.body);
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(201).json({ data: result.data });
    } catch (error) {
      console.error('Error creating healing product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}