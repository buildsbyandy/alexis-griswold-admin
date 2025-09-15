import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

type RecipeRow = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Recipe ID required' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Recipe not found' })
        }
        console.error('Error fetching recipe:', error)
        return res.status(500).json({ error: 'Failed to fetch recipe' })
      }

      return res.status(200).json({ recipe: data as RecipeRow })
    } catch (error) {
      console.error('Recipe fetch error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // All modification operations require admin authentication
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email
  if (!email || !isAdminEmail(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const {
        title,
        slug,
        description,
        category,
        folder_slug,
        difficulty,
        servings,
        prepTime,
        cookTime,
        ingredients,
        instructions,
        tags,
        status,
        is_favorite,
        is_beginner,
        is_recipe_of_week,
        hero_image_path,
        images
      } = req.body

      // Build update object with only provided fields
      const updateData: RecipeUpdate = {
        updated_at: new Date().toISOString()
      }

      if (title !== undefined) updateData.title = title
      if (slug !== undefined) updateData.slug = slug
      if (description !== undefined) updateData.description = description
      if (category !== undefined) updateData.category = category
      if (folder_slug !== undefined) updateData.folder_slug = folder_slug
      if (difficulty !== undefined) updateData.difficulty = difficulty
      if (servings !== undefined) updateData.servings = servings
      if (prepTime !== undefined) updateData.prepTime = prepTime
      if (cookTime !== undefined) updateData.cookTime = cookTime
      if (ingredients !== undefined) updateData.ingredients = ingredients
      if (instructions !== undefined) updateData.instructions = instructions
      if (tags !== undefined) updateData.tags = tags
      if (status !== undefined) updateData.status = status
      if (is_favorite !== undefined) updateData.is_favorite = is_favorite
      if (is_beginner !== undefined) updateData.is_beginner = is_beginner
      if (is_recipe_of_week !== undefined) updateData.is_recipe_of_week = is_recipe_of_week
      if (hero_image_path !== undefined) updateData.hero_image_path = hero_image_path
      if (images !== undefined) updateData.images = images

      const { data, error } = await supabaseAdmin
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Recipe not found' })
        }
        console.error('Error updating recipe:', error)
        return res.status(500).json({ error: 'Failed to update recipe' })
      }

      return res.status(200).json({ recipe: data as RecipeRow })
    } catch (error) {
      console.error('Recipe update error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('recipes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting recipe:', error)
        return res.status(500).json({ error: 'Failed to delete recipe' })
      }

      return res.status(200).json({ message: 'Recipe deleted successfully' })
    } catch (error) {
      console.error('Recipe delete error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).json({ error: 'Method Not Allowed' })
}