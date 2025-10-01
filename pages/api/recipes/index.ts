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
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
      return res.status(500).json({ error: 'Failed to fetch recipes' })
    }

    return res.status(200).json({ recipes: data as RecipeRow[] })
  }

  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email
    if (!email || !isAdminEmail(email)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

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

      // Validate required fields
      if (!title?.trim()) {
        return res.status(400).json({ error: 'Title is required' })
      }
      if (!slug?.trim()) {
        return res.status(400).json({ error: 'Slug is required' })
      }
      if (!folder_slug?.trim()) {
        return res.status(400).json({ error: 'Folder is required' })
      }
      if (!status) {
        return res.status(400).json({ error: 'Status is required' })
      }

      const recipeData: RecipeInsert = {
        title,
        slug,
        description: description || null,
        category: category || null,
        folder_slug,
        difficulty: difficulty || null,
        servings: servings || null,
        prepTime: prepTime || null,
        cookTime: cookTime || null,
        tags: tags || [],
        status,
        is_favorite: is_favorite || false,
        is_beginner: is_beginner || false,
        is_recipe_of_week: is_recipe_of_week || false,
        hero_image_path: hero_image_path || null,
        images: images || []
      }

      const { data, error } = await supabaseAdmin
        .from('recipes')
        .insert(recipeData)
        .select('*')
        .single()

      if (error) {
        console.error('Error creating recipe:', error)
        return res.status(500).json({ error: 'Failed to create recipe' })
      }

      return res.status(201).json({ recipe: data as RecipeRow })
    } catch (error) {
      console.error('Recipe creation error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'Method Not Allowed' })
}

