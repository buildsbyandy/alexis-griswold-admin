/**
 * REFACTORED: Healing carousels API using unified carousel schema
 * - Delegates to carouselService for all operations
 * - Uses unified carousels + carousel_items tables
 * - Thin wrapper maintaining backward compatibility
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isAdminEmail from '../../../lib/auth/isAdminEmail';
import { listCarousels, upsertHealingHeader } from '../../../lib/services/carouselService';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const result = await listCarousels('healing'); // returns both part 1 & 2
      if (result.error) return res.status(500).json({ error: result.error });
      return res.status(200).json({ data: result.data || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Authentication required for POST/PUT
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const { type, title, description, is_active } = req.body as {
        type?: 'part1' | 'part2';
        title?: string;
        description?: string;
        is_active?: boolean;
      };

      if (!type || (type !== 'part1' && type !== 'part2')) {
        return res.status(400).json({ error: 'type must be "part1" or "part2"' });
      }
      if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
      }

      const result = await upsertHealingHeader({ type, title, description, is_active });
      if (result.error) return res.status(500).json({ error: result.error });
      return res.status(200).json({ data: result.data });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET,PUT');
  return res.status(405).json({ error: 'Method Not Allowed' });
}