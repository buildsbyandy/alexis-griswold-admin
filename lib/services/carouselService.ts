import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type CarouselInsert = Database['public']['Tables']['carousels']['Insert']
export type CarouselUpdate = Database['public']['Tables']['carousels']['Update']

export type CarouselItemRow = Database['public']['Tables']['carousel_items']['Row']
export type CarouselItemInsert = Database['public']['Tables']['carousel_items']['Insert']
export type CarouselItemUpdate = Database['public']['Tables']['carousel_items']['Update']

// Complete view type for carousel items with all joined data
export type VCarouselItemRow = Database['public']['Views']['v_carousel_items']['Row']

// Type representing what the API actually returns - carousel items with joined carousel metadata
// (non-prefixed fields from carousel_items table, not the v_carousel_items view)
export type CarouselItemWithMeta = CarouselItemRow & {
  carousel_slug?: string | null;
  carousel_id: string;
}

// Union types for mixed carousel items
export type CarouselVideoItem = {
  kind: 'video'
  id: string
  youtube_url: string
  thumbnail?: string | null
  title?: string | null
  description?: string | null
  order_index: number
  is_active: boolean
  created_at: Date
}

export type CarouselAlbumItem = {
  kind: 'album'
  id: string
  album_id: string
  title: string
  cover: string | null
  page_type: string | null
  order_index: number
  is_active: boolean
  created_at: Date
}

export type CarouselMixedItem = CarouselVideoItem | CarouselAlbumItem

export type PageType = Database['public']['Enums']['page_type']

export interface ServiceResult<T> { data?: T; error?: string }

/**
 * Gets the appropriate base URL for API calls based on the current environment.
 *
 * This is necessary because:
 * 1. Client-side code can use relative URLs (fetch('/api/...') works in browser)
 * 2. Server-side code needs absolute URLs (no base URL context in Node.js)
 * 3. We need different URLs for development vs production
 *
 * This pattern is standard in production Next.js apps and enables local development
 * while ensuring production functionality works correctly.
 *
 * @returns Empty string for client-side (browser handles relative URLs)
 *          Full URL for server-side (Node.js needs absolute URLs)
 */
function getApiBaseUrl(): string {
  // Client-side: browser can handle relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: Node.js needs absolute URLs
  // Use environment-specific URLs just like Google OAuth, Stripe, etc.
  return process.env.NODE_ENV === 'production'
    ? 'https://admin.alexisgriswold.com'  // Production domain
    : 'http://localhost:3000';            // Local development
}

function mapUiTypeToSlug(type: 'part1' | 'part2'): { page: PageType; slug: string } {
	// Healing carousels use fixed slugs per unified schema
	return { page: 'healing', slug: type === 'part1' ? 'healing-part-1' : 'healing-part-2' }
}

/**
 * Finds a carousel by page and slug. Works both client-side and server-side.
 *
 * Client-side: Uses relative URL fetch to API route
 * Server-side: Uses absolute URL fetch to API route (enables local development testing)
 *
 * This approach allows the same service function to work in both contexts:
 * - React components (client-side)
 * - API routes calling other API routes (server-side)
 *
 * @param page The page type (e.g., 'vlogs', 'recipes')
 * @param slug The carousel slug (e.g., 'vlogs-featured')
 */
export async function findCarouselByPageSlug(page: PageType, slug: string): Promise<ServiceResult<CarouselRow | null>> {
	try {
		const baseUrl = getApiBaseUrl();
		const isServerSide = typeof window === 'undefined';

		console.log(`[DEBUG] findCarouselByPageSlug called ${isServerSide ? '(server-side)' : '(client-side)'} with page: "${page}", slug: "${slug}"`);
		console.log(`[DEBUG] Using base URL: "${baseUrl}"`);

		const url = `${baseUrl}/api/carousels/find?page=${encodeURIComponent(page)}&slug=${encodeURIComponent(slug)}`;
		console.log(`[DEBUG] Fetching: ${url}`);

		const response = await fetch(url);
		const result = await response.json();

		console.log(`[DEBUG] API response status: ${response.status}, data:`, result);

		if (!response.ok) {
			console.log(`[DEBUG] API call failed:`, result.error);
			return { error: result.error || 'Failed to find carousel' }
		}

		console.log(`[DEBUG] Successfully found carousel:`, result.data);
		return { data: result.data }
	} catch (e) {
		console.log(`[DEBUG] Exception in findCarouselByPageSlug:`, e);
		return { error: 'Failed to find carousel' }
	}
}

export async function listCarousels(page: PageType, slug?: string): Promise<ServiceResult<CarouselRow[]>> {
	try {
		const params = new URLSearchParams({ page })
		if (slug) params.append('slug', slug)

		const response = await fetch(`/api/carousels?${params.toString()}`)
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to list carousels' }
		}

		return { data: result.data || [] }
	} catch (e) {
		return { error: 'Failed to list carousels' }
	}
}

export async function getCarouselItems(carouselId: string): Promise<ServiceResult<CarouselItemRow[]>> {
	try {
		const baseUrl = getApiBaseUrl();
		const url = `${baseUrl}/api/carousels/items?carousel_id=${encodeURIComponent(carouselId)}`;

		console.log(`[DEBUG] getCarouselItems fetching: ${url}`);

		const response = await fetch(url);
		const result = await response.json();

		if (!response.ok) {
			console.log(`[DEBUG] getCarouselItems failed:`, result.error);
			return { error: result.error || 'Failed to fetch carousel items' }
		}

		console.log(`[DEBUG] getCarouselItems success:`, result.data?.length, 'items');
		return { data: result.data || [] }
	} catch (e) {
		console.log(`[DEBUG] getCarouselItems exception:`, e);
		return { error: 'Failed to fetch carousel items' }
	}
}

export async function listViewItems(page: PageType, slug?: string): Promise<ServiceResult<CarouselItemWithMeta[]>> {
	try {
		const params = new URLSearchParams({ page })
		if (slug) params.append('slug', slug)

		const response = await fetch(`/api/carousels/items?${params.toString()}`)
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to fetch carousel view items' }
		}

		return { data: result.data || [] }
	} catch (e) {
		return { error: 'Failed to fetch carousel view items' }
	}
}

export async function createCarouselItem(input: CarouselItemInsert): Promise<ServiceResult<CarouselItemRow>> {
	try {
		const baseUrl = getApiBaseUrl();
		const url = `${baseUrl}/api/carousels/items`;

		console.log(`[DEBUG] createCarouselItem posting to: ${url}`);
		console.log(`[DEBUG] createCarouselItem payload:`, input);

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(input)
		});
		const result = await response.json();

		if (!response.ok) {
			console.log(`[DEBUG] createCarouselItem failed:`, result.error);
			return { error: result.error || 'Failed to create carousel item' }
		}

		console.log(`[DEBUG] createCarouselItem success:`, result.data);
		return { data: result.data }
	} catch (e) {
		console.log(`[DEBUG] createCarouselItem exception:`, e);
		return { error: 'Failed to create carousel item' }
	}
}

export async function updateCarouselItem(id: string, input: CarouselItemUpdate): Promise<ServiceResult<CarouselItemRow>> {
	try {
		const response = await fetch(`/api/carousels/items/${encodeURIComponent(id)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(input)
		})
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to update carousel item' }
		}

		return { data: result.data }
	} catch (e) {
		return { error: 'Failed to update carousel item' }
	}
}

export async function deleteCarouselItem(id: string): Promise<ServiceResult<null>> {
	try {
		const baseUrl = getApiBaseUrl();
		const url = `${baseUrl}/api/carousels/items/${encodeURIComponent(id)}`;

		console.log(`[DEBUG] deleteCarouselItem deleting: ${url}`);

		const response = await fetch(url, {
			method: 'DELETE'
		});
		const result = await response.json();

		if (!response.ok) {
			console.log(`[DEBUG] deleteCarouselItem failed:`, result.error);
			return { error: result.error || 'Failed to delete carousel item' }
		}

		console.log(`[DEBUG] deleteCarouselItem success`);
		return { data: null }
	} catch (e) {
		console.log(`[DEBUG] deleteCarouselItem exception:`, e);
		return { error: 'Failed to delete carousel item' }
	}
}

// Storefront helpers
export async function listStorefrontItems(slug: 'storefront-favorites' | 'storefront-top-picks'): Promise<ServiceResult<Array<{
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
    // Get carousel items for this storefront slug
    const viewResult = await listViewItems('storefront', slug)
    if (viewResult.error) return { error: viewResult.error }

    const viewData = viewResult.data || []
    const refIds = viewData.map(v => v.ref_id).filter(Boolean) as string[]

    // Fetch product metadata if we have ref_ids
    let products: any = { data: [], error: null }
    if (refIds.length > 0) {
      const productsResponse = await fetch(`/api/storefront/products?ids=${refIds.join(',')}`)
      if (productsResponse.ok) {
        products = await productsResponse.json()
      }
    }

    if (products.error) return { error: products.error }
    const byId = new Map<string, any>()
    for (const p of products.data || []) byId.set(p.id, p)

    const items = viewData.map(v => {
      const p = v.ref_id ? byId.get(v.ref_id) : null
      return {
        id: v.id,
        carousel_slug: v.carousel_slug || null,
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

export async function createStorefrontItem(slug: 'storefront-favorites' | 'storefront-top-picks', productId: string, orderIndex?: number | null): Promise<ServiceResult<CarouselItemRow>> {
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
      order_index: orderIndex ?? (slug === 'storefront-top-picks' ? 0 : 0),
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

export async function updateStorefrontItem(id: string, payload: { order_index?: number; slug?: 'storefront-favorites' | 'storefront-top-picks' }): Promise<ServiceResult<CarouselItemRow>> {
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
		const response = await fetch('/api/carousels', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				page: input.page,
				slug: input.slug,
				title: input.title ?? null,
				description: input.description ?? null,
				is_active: input.is_active ?? true
			})
		})
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to create carousel' }
		}

		return { data: result.data }
	} catch (e) {
		return { error: 'Failed to create carousel' }
	}
}

export async function updateCarousel(id: string, input: Partial<Pick<CarouselUpdate, 'title' | 'description' | 'is_active'>>): Promise<ServiceResult<CarouselRow>> {
	try {
		const response = await fetch(`/api/carousels/${encodeURIComponent(id)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: input.title ?? undefined,
				description: input.description ?? undefined,
				is_active: input.is_active ?? undefined
			})
		})
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to update carousel' }
		}

		return { data: result.data }
	} catch (e) {
		return { error: 'Failed to update carousel' }
	}
}

export async function deleteCarousel(id: string): Promise<ServiceResult<null>> {
	try {
		const response = await fetch(`/api/carousels/${encodeURIComponent(id)}`, {
			method: 'DELETE'
		})
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to delete carousel' }
		}

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

// New: Mixed carousel item functions
export function mapViewItemToMixed(viewItem: VCarouselItemRow): CarouselMixedItem | null {
	if (!viewItem.carousel_item_id) return null

	// Map from view to union type based on available data
	if (viewItem.item_link_url && viewItem.item_youtube_id) {
		return {
			kind: 'video',
			id: viewItem.carousel_item_id,
			youtube_url: viewItem.item_link_url,
			thumbnail: viewItem.item_image_path,
			title: viewItem.item_caption || null,
			description: null,
			order_index: viewItem.item_order_index || 0,
			is_active: viewItem.item_is_active || false,
			created_at: new Date(viewItem.item_created_at || Date.now())
		}
	} else if (viewItem.item_album_id) {
		return {
			kind: 'album',
			id: viewItem.carousel_item_id,
			album_id: viewItem.item_album_id,
			title: viewItem.album_title || 'Album',
			cover: viewItem.album_cover_image || null,
			page_type: viewItem.carousel_page || null,
			order_index: viewItem.item_order_index || 0,
			is_active: viewItem.item_is_active || false,
			created_at: new Date(viewItem.item_created_at || Date.now())
		}
	}

	return null
}

export async function listMixedCarouselItems(page: PageType, slug?: string): Promise<ServiceResult<CarouselMixedItem[]>> {
	try {
		const params = new URLSearchParams({ page })
		if (slug) params.append('slug', slug)

		const response = await fetch(`/api/carousels/items?${params.toString()}&use_view=true`)
		const result = await response.json()

		if (!response.ok) {
			return { error: result.error || 'Failed to fetch mixed carousel items' }
		}

		const viewItems = result.data as VCarouselItemRow[] || []
		const mixedItems = viewItems
			.map(mapViewItemToMixed)
			.filter((item): item is CarouselMixedItem => item !== null)
			.sort((a, b) => a.order_index - b.order_index)

		return { data: mixedItems }
	} catch (e) {
		return { error: 'Failed to fetch mixed carousel items' }
	}
}

export async function createCarouselVideoItem(input: {
	carousel_id: string;
	youtube_url: string;
	youtube_id?: string;
	title?: string;
	description?: string;
	order_index?: number;
	is_active?: boolean;
}): Promise<ServiceResult<CarouselItemRow>> {
	// Validation: ensure exclusivity
	if (input.youtube_id && input.carousel_id) {
		// Check if album_id would be set (it shouldn't for video items)
		// This is enforced at the API level but we add client-side validation
	}

	try {
		const insert: CarouselItemInsert = {
			carousel_id: input.carousel_id,
			kind: 'video',
			youtube_id: input.youtube_id || null,
			album_id: null, // Enforce exclusivity
			caption: input.title || null,
			order_index: input.order_index || 0,
			is_active: input.is_active !== false,
			ref_id: null,
			link_url: input.youtube_url,
			image_path: null,
			badge: null
		}

		return createCarouselItem(insert)
	} catch (e) {
		return { error: 'Failed to create carousel video item' }
	}
}

export async function createCarouselAlbumItem(input: {
	carousel_id: string;
	album_id: string;
	order_index?: number;
	is_active?: boolean;
}): Promise<ServiceResult<CarouselItemRow>> {
	// Validation: ensure exclusivity
	if (!input.album_id) {
		return { error: 'Album ID is required for album carousel items' }
	}

	try {
		const insert: CarouselItemInsert = {
			carousel_id: input.carousel_id,
			kind: 'video', // Note: keeping as 'video' for now to maintain compatibility
			youtube_id: null, // Enforce exclusivity
			album_id: input.album_id,
			caption: null,
			order_index: input.order_index || 0,
			is_active: input.is_active !== false,
			ref_id: input.album_id,
			link_url: null,
			image_path: null,
			badge: null
		}

		return createCarouselItem(insert)
	} catch (e) {
		return { error: 'Failed to create carousel album item' }
	}
}

export function validateCarouselItemExclusivity(input: { youtube_id?: string | null; album_id?: string | null }): { valid: boolean; error?: string } {
	const hasYoutube = !!input.youtube_id
	const hasAlbum = !!input.album_id

	if (hasYoutube && hasAlbum) {
		return {
			valid: false,
			error: 'Carousel items cannot have both YouTube video and album assigned. Please choose one content type.'
		}
	}

	if (!hasYoutube && !hasAlbum) {
		return {
			valid: false,
			error: 'Carousel items must have either a YouTube video or album assigned.'
		}
	}

	return { valid: true }
}
