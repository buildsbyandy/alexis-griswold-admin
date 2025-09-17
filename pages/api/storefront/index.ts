import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import storefrontService from '../../../lib/services/storefrontService'

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
			// Delegate to storefrontService for product creation
			const product = await storefrontService.create_storefront_product(req.body)
			return res.status(201).json({ product })
		} catch (error) {
			console.error('Error creating storefront product:', error)
			return res.status(500).json({ error: 'Internal server error' })
		}
	}

	res.setHeader('Allow', 'GET,POST')
	return res.status(405).json({ error: 'Method Not Allowed' })
}