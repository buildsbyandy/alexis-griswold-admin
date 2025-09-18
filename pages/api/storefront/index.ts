import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import storefrontService from '../../../lib/services/storefrontService'
import { z } from 'zod'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			// Delegate to storefrontService with optional filters
			const products = await storefrontService.get_storefront_products()
			return res.status(200).json({ products })
		} catch (error) {
			console.error('Error fetching storefront products:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}

	if (req.method === 'POST') {
		const session = await getServerSession(req, res, authOptions)
		const email = session?.user?.email
		if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })

    try {
      const BodySchema = z.object({
        name: z.string().trim().min(1).max(255).optional(),
        product_title: z.string().trim().min(1).max(255).optional(),
        slug: z.string().trim().min(1).max(255).optional(),
        category_slug: z.string().trim().max(255).optional(),
        status: z.enum(['draft','published','archived']),
        amazon_url: z.string().trim().url(),
        price: z.number().optional(),
        image_path: z.string().trim().optional(),
        image_alt: z.string().trim().optional(),
        description: z.string().trim().optional(),
        tags: z.array(z.string()).optional(),
      })
      const parsed = BodySchema.parse(req.body)
      const payload = {
        ...parsed,
        product_title: (parsed.name ?? parsed.product_title)!,
      }
      const product = await storefrontService.create_storefront_product(payload)
			return res.status(201).json({ product })
		} catch (error) {
			console.error('Error creating storefront product:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}

	res.setHeader('Allow', 'GET,POST')
	return res.status(405).json({ error: 'Method Not Allowed' })
}