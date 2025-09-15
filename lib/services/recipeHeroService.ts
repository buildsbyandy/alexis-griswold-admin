import supabaseAdmin from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type RecipeHeroVideoRow = Database['public']['Tables']['recipe_hero_videos']['Row']
export type RecipeHeroVideoInsert = Database['public']['Tables']['recipe_hero_videos']['Insert']
export type RecipeHeroVideoUpdate = Database['public']['Tables']['recipe_hero_videos']['Update']

export async function getRecipeHeroVideos(): Promise<RecipeHeroVideoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('recipe_hero_videos')
    .select('*')
    .order('video_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch recipe hero videos: ${error.message}`)
  }
  return (data as RecipeHeroVideoRow[]) || []
}

export async function getRecipeHeroVideoById(id: string): Promise<RecipeHeroVideoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('recipe_hero_videos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    // PGRST116: No rows found
    if ((error as any).code === 'PGRST116') return null
    throw new Error(`Failed to fetch recipe hero video: ${error.message}`)
  }
  return data as RecipeHeroVideoRow
}

export async function createRecipeHeroVideo(input: RecipeHeroVideoInsert): Promise<RecipeHeroVideoRow> {
  const insertData: RecipeHeroVideoInsert = {
    youtube_url: input.youtube_url,
    video_title: input.video_title ?? null,
    video_description: input.video_description ?? null,
    video_order: input.video_order ?? 0,
    video_thumbnail_url: input.video_thumbnail_url ?? null,
    video_type: input.video_type ?? 'reel',
    is_active: input.is_active ?? true,
    created_at: input.created_at,
    updated_at: input.updated_at,
    id: (input as any).id, // allow id passthrough if caller supplies
  }

  const { data, error } = await supabaseAdmin
    .from('recipe_hero_videos')
    .insert(insertData)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create recipe hero video: ${error.message}`)
  }
  return data as RecipeHeroVideoRow
}

export async function updateRecipeHeroVideo(id: string, input: RecipeHeroVideoUpdate): Promise<RecipeHeroVideoRow | null> {
  const updateData: RecipeHeroVideoUpdate & { updated_at?: string } = {
    ...input,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('recipe_hero_videos')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if ((error as any).code === 'PGRST116') return null
    throw new Error(`Failed to update recipe hero video: ${error.message}`)
  }
  return data as RecipeHeroVideoRow
}

export async function deleteRecipeHeroVideo(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('recipe_hero_videos')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete recipe hero video: ${error.message}`)
  }
  return true
}


