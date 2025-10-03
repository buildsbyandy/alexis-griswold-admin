import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import isAdminEmail from '../../../lib/auth/isAdminEmail'
import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'
import {
  findCarouselByPageSlugDB,
  createCarouselDB,
  getCarouselItemsDB,
  createCarouselItemDB,
  deleteCarouselItemDB,
} from '../../../lib/db/carousels'

type RecipeRow = Database['public']['Tables']['recipes']['Row']
type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export const config = { runtime: 'nodejs' }

// Helper function to handle beginner recipe carousel integration
async function handleBeginnerRecipeCarousel(recipeId: string, isBeginnerFlag: boolean, recipeTitle: string) {
  // Find or create the beginner carousel - use DB functions
  let carousel = await findCarouselByPageSlugDB('recipes', 'recipes-beginner')
  if (carousel.error) throw new Error(carousel.error)
  if (!carousel.data) {
    const created = await createCarouselDB({ page: 'recipes', slug: 'recipes-beginner', is_active: true })
    if (created.error) throw new Error(created.error)
    carousel = { data: created.data }
  }

  // Get current items to check if recipe is already in carousel
  if (!carousel.data) throw new Error('Beginner carousel not found')
  const items = await getCarouselItemsDB(carousel.data.id)
  if (items.error) throw new Error(items.error)
  const existingItem = (items.data || []).find(item => item.ref_id === recipeId)

  if (isBeginnerFlag) {
    // Add to carousel if not already there
    if (!existingItem) {
      const result = await createCarouselItemDB({
        carousel_id: carousel.data.id,
        kind: 'recipe',
        ref_id: recipeId,
        caption: recipeTitle,
        order_index: (items.data?.length || 0) + 1,
        is_active: true,
      })
      if (result.error) throw new Error(result.error)
    }
  } else {
    // Remove from carousel if it exists
    if (existingItem) {
      const result = await deleteCarouselItemDB(existingItem.id)
      if (result.error) throw new Error(result.error)
    }
  }
}

// Helper function to handle recipe of the week carousel integration (single-item carousel)
async function handleRecipeOfWeekCarousel(recipeId: string, isRecipeOfWeekFlag: boolean, recipeTitle: string) {
  // Find or create the weekly pick carousel - use DB functions
  let carousel = await findCarouselByPageSlugDB('recipes', 'recipes-weekly-pick')
  if (carousel.error) throw new Error(carousel.error)
  if (!carousel.data) {
    const created = await createCarouselDB({ page: 'recipes', slug: 'recipes-weekly-pick', is_active: true })
    if (created.error) throw new Error(created.error)
    carousel = { data: created.data }
  }

  // Get current items
  if (!carousel.data) throw new Error('Weekly pick carousel not found')
  const items = await getCarouselItemsDB(carousel.data.id)
  if (items.error) throw new Error(items.error)

  if (isRecipeOfWeekFlag) {
    // First, delete ALL existing items (enforce "only one" rule)
    for (const item of items.data || []) {
      await deleteCarouselItemDB(item.id)
    }

    // Then create new item for this recipe
    const result = await createCarouselItemDB({
      carousel_id: carousel.data.id,
      kind: 'recipe',
      ref_id: recipeId,
      caption: recipeTitle,
      order_index: 1,
      is_active: true,
    })
    if (result.error) throw new Error(result.error)
  } else {
    // Remove this recipe from carousel if it exists
    const existingItem = (items.data || []).find(item => item.ref_id === recipeId)
    if (existingItem) {
      const result = await deleteCarouselItemDB(existingItem.id)
      if (result.error) throw new Error(result.error)
    }
  }
}

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
        tags,
        status,
        is_favorite,
        is_beginner,
        is_recipe_of_week,
        hero_image_path
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
      if (tags !== undefined) updateData.tags = tags
      if (status !== undefined) updateData.status = status
      if (is_favorite !== undefined) updateData.is_favorite = is_favorite
      if (is_beginner !== undefined) updateData.is_beginner = is_beginner
      if (is_recipe_of_week !== undefined) updateData.is_recipe_of_week = is_recipe_of_week
      if (hero_image_path !== undefined) updateData.hero_image_path = hero_image_path
      // Note: images field removed - images are now managed via recipe_steps table

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

      // Handle carousel integrations for boolean flags
      try {
        // Handle beginner recipe carousel
        if (is_beginner !== undefined) {
          await handleBeginnerRecipeCarousel(id, is_beginner, data.title)
        }

        // Handle recipe of the week carousel
        if (is_recipe_of_week !== undefined) {
          await handleRecipeOfWeekCarousel(id, is_recipe_of_week, data.title)
        }
      } catch (carouselError) {
        console.warn('Recipe updated but carousel sync failed:', carouselError)
        // Don't fail the whole operation since the recipe was updated
      }

      return res.status(200).json({ recipe: data as RecipeRow })
    } catch (error) {
      console.error('Recipe update error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First, fetch the recipe and its steps to get image paths
      const { data: recipe } = await supabaseAdmin
        .from('recipes')
        .select(`
          hero_image_path,
          recipe_steps(image_path)
        `)
        .eq('id', id)
        .single()

      // Collect all image paths to delete from storage
      const imagePaths: string[] = []
      if (recipe?.hero_image_path) {
        imagePaths.push(recipe.hero_image_path)
      }
      if (recipe?.recipe_steps && Array.isArray(recipe.recipe_steps)) {
        recipe.recipe_steps.forEach((step: any) => {
          if (step.image_path) imagePaths.push(step.image_path)
        })
      }

      // Delete recipe from database (cascade will delete recipe_steps)
      const { error } = await supabaseAdmin
        .from('recipes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting recipe:', error)
        return res.status(500).json({ error: 'Failed to delete recipe' })
      }

      // Delete images from storage
      if (imagePaths.length > 0) {
        // Extract bucket and path from full URLs
        const filesToDelete = imagePaths
          .map(path => {
            // Extract path from Supabase URL if it's a full URL
            const match = path.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
            if (match) {
              return { bucket: match[1], path: match[2] }
            }
            // If it's already just a path, assume it's in public bucket
            return { bucket: 'public', path: path.replace(/^public\//, '') }
          })

        // Delete files from their respective buckets
        for (const file of filesToDelete) {
          const { error: storageError } = await supabaseAdmin.storage
            .from(file.bucket)
            .remove([file.path])

          if (storageError) {
            console.error(`Failed to delete ${file.path} from ${file.bucket}:`, storageError)
            // Continue anyway - database is already cleaned up
          }
        }
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