import { youtubeService } from './youtubeService'
import {
  findCarouselByPageSlug,
  createCarousel,
  getCarouselItems,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
} from './carouselService'

export interface RecipeHeroVideoRow {
  id: string
  youtube_url: string
  video_title: string | null
  video_description: string | null
  video_order: number
  video_thumbnail_url: string | null
  video_type: string | null
  is_active: boolean | null
  created_at?: string
  updated_at?: string
}

const RECIPES_HERO_SLUG = 'recipes-hero'

export async function getRecipeHeroVideos(): Promise<RecipeHeroVideoRow[]> {
  const carousel = await findCarouselByPageSlug('recipes', RECIPES_HERO_SLUG)
  if (carousel.error) throw new Error(carousel.error)
  if (!carousel.data) return []

  const items = await getCarouselItems(carousel.data.id)
  if (items.error) throw new Error(items.error)

  const videos = await Promise.all((items.data || [])
    .filter(i => i.kind === 'video')
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .map(async (i) => {
      const youtube_id = i.youtube_id || ''
      const meta = youtube_id ? await youtubeService.get_video_data(youtube_id) : { data: undefined }
      const url = youtube_id ? (youtubeService.format_youtube_url(youtube_id).data || '') : ''
      return {
        id: i.id,
        youtube_url: url,
        video_title: i.caption || meta.data?.title || null,
        video_description: meta.data?.description || null,
        video_order: i.order_index || 0,
        video_thumbnail_url: meta.data?.thumbnail_url || null,
        video_type: 'video',
        is_active: i.is_active ?? true,
        created_at: i.created_at,
        updated_at: i.updated_at,
      } as RecipeHeroVideoRow
    }))

  return videos
}

export async function getRecipeHeroVideoById(id: string): Promise<RecipeHeroVideoRow | null> {
  const carousel = await findCarouselByPageSlug('recipes', RECIPES_HERO_SLUG)
  if (carousel.error) throw new Error(carousel.error)
  if (!carousel.data) return null
  const items = await getCarouselItems(carousel.data.id)
  if (items.error) throw new Error(items.error)
  const found = (items.data || []).find(i => i.id === id)
  if (!found) return null
  const youtube_id = found.youtube_id || ''
  const meta = youtube_id ? await youtubeService.get_video_data(youtube_id) : { data: undefined }
  const url = youtube_id ? (youtubeService.format_youtube_url(youtube_id).data || '') : ''
  return {
    id: found.id,
    youtube_url: url,
    video_title: found.caption || meta.data?.title || null,
    video_description: meta.data?.description || null,
    video_order: found.order_index || 0,
    video_thumbnail_url: meta.data?.thumbnail_url || null,
    video_type: 'video',
    is_active: found.is_active ?? true,
    created_at: found.created_at,
    updated_at: found.updated_at,
  }
}

export async function createRecipeHeroVideo(input: {
  youtube_url: string
  video_title?: string | null
  video_description?: string | null
  video_order?: number | null
}): Promise<RecipeHeroVideoRow> {
  const idRes = youtubeService.extract_video_id(input.youtube_url)
  if (idRes.error) throw new Error(idRes.error)
  const youtube_id = idRes.data!

  // Ensure carousel exists
  let carousel = await findCarouselByPageSlug('recipes', RECIPES_HERO_SLUG)
  if (carousel.error) throw new Error(carousel.error)
  if (!carousel.data) {
    const created = await createCarousel({ page: 'recipes', slug: RECIPES_HERO_SLUG, is_active: true })
    if (created.error) throw new Error(created.error)
    carousel = { data: created.data }
  }

  // Determine caption and order
  let caption = input.video_title || null
  if (!caption) {
    const meta = await youtubeService.get_video_data(youtube_id)
    caption = meta.data?.title || null
  }

  const order_index = input.video_order ?? 0

  const createdItem = await createCarouselItem({
    carousel_id: carousel.data!.id,
    kind: 'video',
    order_index,
    youtube_id,
    caption,
    is_active: true,
  })
  if (createdItem.error) throw new Error(createdItem.error)

  // Build response
  const meta = await youtubeService.get_video_data(youtube_id)
  const url = youtubeService.format_youtube_url(youtube_id).data || input.youtube_url
  return {
    id: createdItem.data!.id,
    youtube_url: url,
    video_title: caption || meta.data?.title || null,
    video_description: (input.video_description ?? meta.data?.description) || null,
    video_order: order_index,
    video_thumbnail_url: meta.data?.thumbnail_url || null,
    video_type: 'video',
    is_active: createdItem.data!.is_active ?? true,
    created_at: createdItem.data!.created_at,
    updated_at: createdItem.data!.updated_at,
  }
}

export async function updateRecipeHeroVideo(id: string, input: {
  youtube_url?: string
  video_title?: string | null
  video_description?: string | null
  video_order?: number | null
  is_active?: boolean | null
}): Promise<RecipeHeroVideoRow | null> {
  const update: any = {}

  if (input.youtube_url) {
    const idRes = youtubeService.extract_video_id(input.youtube_url)
    if (idRes.error) throw new Error(idRes.error)
    update.youtube_id = idRes.data
  }
  if (input.video_title !== undefined) update.caption = input.video_title
  if (input.video_order !== undefined && input.video_order !== null) update.order_index = input.video_order
  if (input.is_active !== undefined) update.is_active = input.is_active
  update.updated_at = new Date().toISOString()

  const updated = await updateCarouselItem(id, update)
  if (updated.error) {
    // If not found, return null. No specific code guaranteed here, so try a fetch and check
    return null
  }

  const youtube_id = updated.data!.youtube_id || ''
  const meta = youtube_id ? await youtubeService.get_video_data(youtube_id) : { data: undefined }
  const url = youtube_id ? (youtubeService.format_youtube_url(youtube_id).data || '') : ''
  return {
    id: updated.data!.id,
    youtube_url: url,
    video_title: updated.data!.caption || meta.data?.title || null,
    video_description: (input.video_description ?? meta.data?.description) || null,
    video_order: updated.data!.order_index || 0,
    video_thumbnail_url: meta.data?.thumbnail_url || null,
    video_type: 'video',
    is_active: updated.data!.is_active ?? true,
    created_at: updated.data!.created_at,
    updated_at: updated.data!.updated_at,
  }
}

export async function deleteRecipeHeroVideo(id: string): Promise<boolean> {
  const deleted = await deleteCarouselItem(id)
  if (deleted.error) throw new Error(deleted.error)
  return true
}

