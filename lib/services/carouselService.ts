import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type CarouselInsert = Database['public']['Tables']['carousels']['Insert']
export type CarouselUpdate = Database['public']['Tables']['carousels']['Update']

export type CarouselItemRow = Database['public']['Tables']['carousel_items']['Row']
export type CarouselItemInsert = Database['public']['Tables']['carousel_items']['Insert']
export type CarouselItemUpdate = Database['public']['Tables']['carousel_items']['Update']

export type VCarouselItemRow = Database['public']['Tables']['v_carousel_items']['Row']

export type PageType = Database['public']['Enums']['page_type']

export interface ServiceResult<T> { data?: T; error?: string }

function mapUiTypeToSlug(type: 'part1' | 'part2'): { page: PageType; slug: string } {
	// Healing carousels use fixed slugs per unified schema
	return { page: 'healing', slug: type === 'part1' ? 'healing-part-1' : 'healing-part-2' }
}

export async function findCarouselByPageSlug(page: PageType, slug: string): Promise<ServiceResult<CarouselRow | null>> {
	try {
		const { data, error } = await supabase.from('carousels').select('*').eq('page', page).eq('slug', slug).single()
		if (error) {
			// If not found, supabase returns error; treat as null when code is PGRST116
			if ((error as any).code === 'PGRST116') return { data: null }
			return { error: error.message }
		}
		return { data }
	} catch (e) {
		return { error: 'Failed to find carousel' }
	}
}

export async function listCarousels(page: PageType, slug?: string): Promise<ServiceResult<CarouselRow[]>> {
	try {
		let query = supabase.from('carousels').select('*').eq('page', page).order('updated_at', { ascending: false })
		if (slug) query = query.eq('slug', slug)
		const { data, error } = await query
		if (error) return { error: error.message }
		return { data: data || [] }
	} catch (e) {
		return { error: 'Failed to list carousels' }
	}
}

export async function getCarouselItems(carouselId: string): Promise<ServiceResult<CarouselItemRow[]>> {
	try {
		const { data, error } = await supabase
			.from('carousel_items')
			.select('*')
			.eq('carousel_id', carouselId)
			.order('order_index', { ascending: true })
		if (error) return { error: error.message }
		return { data: data || [] }
	} catch (e) {
		return { error: 'Failed to fetch carousel items' }
	}
}

export async function listViewItems(page: PageType, slug?: string): Promise<ServiceResult<VCarouselItemRow[]>> {
	try {
		let query = supabase.from('v_carousel_items').select('*').eq('page', page)
		if (slug) query = query.eq('carousel_slug', slug)
		const { data, error } = await query.order('order_index', { ascending: true })
		if (error) return { error: error.message }
		return { data: data || [] }
	} catch (e) {
		return { error: 'Failed to fetch carousel view items' }
	}
}

export async function createCarouselItem(input: CarouselItemInsert): Promise<ServiceResult<CarouselItemRow>> {
	try {
		const { data, error } = await supabase.from('carousel_items').insert(input).select('*').single()
		if (error) return { error: error.message }
		return { data: data as CarouselItemRow }
	} catch (e) {
		return { error: 'Failed to create carousel item' }
	}
}

export async function updateCarouselItem(id: string, input: CarouselItemUpdate): Promise<ServiceResult<CarouselItemRow>> {
	try {
		const { data, error } = await supabase.from('carousel_items').update(input).eq('id', id).select('*').single()
		if (error) return { error: error.message }
		return { data: data as CarouselItemRow }
	} catch (e) {
		return { error: 'Failed to update carousel item' }
	}
}

export async function deleteCarouselItem(id: string): Promise<ServiceResult<null>> {
	try {
		const { error } = await supabase.from('carousel_items').delete().eq('id', id)
		if (error) return { error: error.message }
		return { data: null }
	} catch (e) {
		return { error: 'Failed to delete carousel item' }
	}
}

// Storefront helpers
export async function listStorefrontItems(slug: 'favorites' | 'top-picks'): Promise<ServiceResult<Array<{
  id: string
  carousel_slug: string | null
  order_index: number | null
  ref_id: string | null
  caption: string | null
  product_title: string | null
  image_path: string | null
  amazon_url: string | null
}>>> {
  try {
    // View gives quick access to items; enrich with product metadata
    const view = await supabase.from('v_carousel_items').select('*').eq('page', 'storefront').eq('carousel_slug', slug)
    if (view.error) return { error: view.error.message }

    const refIds = (view.data || []).map(v => v.ref_id).filter(Boolean) as string[]
    const products = refIds.length > 0
      ? await supabase.from('storefront_products').select('id, product_title, image_path, amazon_url').in('id', refIds)
      : { data: [], error: null as any }
    if (products.error) return { error: products.error.message }
    const byId = new Map<string, any>()
    for (const p of products.data || []) byId.set(p.id, p)

    const items = (view.data || []).map(v => {
      const p = v.ref_id ? byId.get(v.ref_id) : null
      return {
        id: v.id!,
        carousel_slug: v.carousel_slug,
        order_index: v.order_index,
        ref_id: v.ref_id,
        caption: v.caption || (p?.product_title ?? null),
        product_title: p?.product_title ?? null,
        image_path: p?.image_path ?? null,
        amazon_url: p?.amazon_url ?? null,
      }
    })
    return { data: items }
  } catch (e) {
    return { error: 'Failed to list storefront items' }
  }
}

export async function createStorefrontItem(slug: 'favorites' | 'top-picks', productId: string, orderIndex?: number | null): Promise<ServiceResult<CarouselItemRow>> {
  try {
    // Ensure carousel exists
    let car = await findCarouselByPageSlug('storefront', slug)
    if (car.error) return { error: car.error }
    if (!car.data) {
      const created = await createCarousel({ page: 'storefront', slug, is_active: true })
      if (created.error) return { error: created.error }
      car = { data: created.data }
    }

    const insert: CarouselItemInsert = {
      carousel_id: car.data!.id,
      kind: 'product',
      ref_id: productId,
      caption: null,
      order_index: orderIndex ?? (slug === 'top-picks' ? 0 : 0),
      is_active: true,
      link_url: null,
      image_path: null,
      youtube_id: null,
      badge: null,
    }
    return createCarouselItem(insert)
  } catch (e) {
    return { error: 'Failed to create storefront item' }
  }
}

export async function updateStorefrontItem(id: string, payload: { order_index?: number; slug?: 'favorites' | 'top-picks' }): Promise<ServiceResult<CarouselItemRow>> {
  try {
    const update: CarouselItemUpdate = {}
    if (payload.order_index !== undefined) update.order_index = payload.order_index
    if (payload.slug) {
      const car = await findCarouselByPageSlug('storefront', payload.slug)
      if (car.error || !car.data) return { error: car.error || 'Target carousel not found' }
      update.carousel_id = car.data.id
    }
    return updateCarouselItem(id, update)
  } catch (e) {
    return { error: 'Failed to update storefront item' }
  }
}

export async function deleteStorefrontItem(id: string): Promise<ServiceResult<null>> {
  return deleteCarouselItem(id)
}

export async function createCarousel(input: Pick<CarouselInsert, 'page' | 'slug'> & Partial<Pick<CarouselInsert, 'title' | 'description' | 'is_active'>>): Promise<ServiceResult<CarouselRow>> {
	try {
		const nowIso = new Date().toISOString()
		const payload: CarouselInsert = {
			page: input.page,
			slug: input.slug,
			title: input.title ?? null,
			description: input.description ?? null,
			is_active: input.is_active ?? true,
			created_at: nowIso,
			updated_at: nowIso,
		}
		const { data, error } = await supabase.from('carousels').insert(payload).select('*').single()
		if (error) return { error: error.message }
		return { data: data as CarouselRow }
	} catch (e) {
		return { error: 'Failed to create carousel' }
	}
}

export async function updateCarousel(id: string, input: Partial<Pick<CarouselUpdate, 'title' | 'description' | 'is_active'>>): Promise<ServiceResult<CarouselRow>> {
	try {
		const payload: CarouselUpdate = {
			title: input.title ?? undefined,
			description: input.description ?? undefined,
			is_active: input.is_active ?? undefined,
			updated_at: new Date().toISOString(),
		}
		const { data, error } = await supabase.from('carousels').update(payload).eq('id', id).select('*').single()
		if (error) return { error: error.message }
		return { data: data as CarouselRow }
	} catch (e) {
		return { error: 'Failed to update carousel' }
	}
}

export async function deleteCarousel(id: string): Promise<ServiceResult<null>> {
	try {
		const { error } = await supabase.from('carousels').delete().eq('id', id)
		if (error) return { error: error.message }
		return { data: null }
	} catch (e) {
		return { error: 'Failed to delete carousel' }
	}
}

// Helpers for healing UI contract: map part1/part2 to unified schema
export async function upsertHealingHeader(input: { type: 'part1' | 'part2'; title: string; description: string; is_active?: boolean }): Promise<ServiceResult<CarouselRow>> {
	const { page, slug } = mapUiTypeToSlug(input.type)
	// Check if exists
	const existing = await listCarousels(page, slug)
	if (existing.error) return { error: existing.error }
	const current = (existing.data || [])[0]
	if (current) {
		return updateCarousel(current.id, { title: input.title, description: input.description, is_active: input.is_active })
	}
	return createCarousel({ page, slug, title: input.title, description: input.description, is_active: input.is_active })
}
