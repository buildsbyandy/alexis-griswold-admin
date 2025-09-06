import { supabaseBrowser } from '../lib/supabase/client'

export type PublishedRecipe = {
	id: string
	slug: string
	title: string
	description: string | null
	hero_image_path: string | null
	tags: string[]
}

export async function fetchPublishedRecipes(limit = 20): Promise<PublishedRecipe[]> {
	const client = supabaseBrowser()
	const { data, error } = await client
		.from('recipes')
		.select('id, slug, title, description, hero_image_path, tags')
		.eq('status', 'published')
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) throw new Error(error.message)
	return data as PublishedRecipe[]
}


