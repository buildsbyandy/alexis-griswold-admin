import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '../../../lib/supabase/admin'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all storefront categories
    const { data, error } = await supabaseAdmin
      .from('storefront_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching storefront categories:', error)
      return res.status(500).json({ error: 'Failed to fetch categories' })
    }
    return res.status(200).json({ categories: data })
  }

  if (req.method === 'POST') {
    // Create new category
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    try {
      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .insert(req.body)
        .select('*')
        .single()
      
      if (error) throw error
      return res.status(201).json({ category: data })
    } catch (error) {
      console.error('Error creating category:', error)
      return res.status(500).json({ error: 'Failed to create category' })
    }
  }

  if (req.method === 'PUT') {
    // Update category
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'Category ID is required' })

    try {
      const { data, error } = await supabaseAdmin
        .from('storefront_categories')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) throw error
      return res.status(200).json({ category: data })
    } catch (error) {
      console.error('Error updating category:', error)
      return res.status(500).json({ error: 'Failed to update category' })
    }
  }

  if (req.method === 'DELETE') {
    // Delete category
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) return res.status(401).json({ error: 'Unauthorized' })
    
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Category ID is required' })

    try {
      // Check if category has products
      const { data: products, error: productsError } = await supabaseAdmin
        .from('storefront_products')
        .select('id')
        .eq('category_name', id)
        .limit(1)

      if (productsError) throw productsError
      
      if (products && products.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with existing products. Move or delete products first.' 
        })
      }

      const { error } = await supabaseAdmin
        .from('storefront_categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting category:', error)
      return res.status(500).json({ error: 'Failed to delete category' })
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}