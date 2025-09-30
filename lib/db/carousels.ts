/**
 * Database functions for carousel operations
 *
 * These functions use direct Supabase calls and can safely import server-only code
 * since they're only used by API routes (server-side context).
 *
 * This layer provides:
 * - Direct database access for server-side operations
 * - No authentication issues (uses service key)
 * - Clean separation from client-side service functions
 */

import supabase from '@/lib/supabase'
import type { Database } from '@/types/supabase.generated'

export type CarouselRow = Database['public']['Tables']['carousels']['Row']
export type CarouselItemRow = Database['public']['Tables']['carousel_items']['Row']
export type CarouselItemInsert = Database['public']['Tables']['carousel_items']['Insert']
export type PageType = Database['public']['Enums']['page_type']

export interface DbResult<T> {
  data?: T
  error?: string
}

/**
 * Find a carousel by page and slug (database version)
 */
export async function findCarouselByPageSlugDB(page: PageType, slug: string): Promise<DbResult<CarouselRow | null>> {
  try {
    console.log(`[DEBUG] findCarouselByPageSlugDB querying for page: "${page}", slug: "${slug}"`);

    const { data, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('page', page)
      .eq('slug', slug)
      .single()

    if (error) {
      // If not found, supabase returns error; treat as null when code is PGRST116
      if ((error as any).code === 'PGRST116') {
        console.log(`[DEBUG] No carousel found (PGRST116), returning null`);
        return { data: null }
      }
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Found carousel:`, data);
    return { data }
  } catch (e) {
    console.log(`[DEBUG] Exception in findCarouselByPageSlugDB:`, e);
    return { error: 'Failed to find carousel' }
  }
}

/**
 * Get carousel items by carousel ID (database version)
 */
export async function getCarouselItemsDB(carouselId: string): Promise<DbResult<CarouselItemRow[]>> {
  try {
    console.log(`[DEBUG] getCarouselItemsDB querying for carousel: ${carouselId}`);

    const { data, error } = await supabase
      .from('carousel_items')
      .select('*')
      .eq('carousel_id', carouselId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Found ${data?.length || 0} carousel items`);
    return { data: data || [] }
  } catch (e) {
    console.log(`[DEBUG] Exception in getCarouselItemsDB:`, e);
    return { error: 'Failed to fetch carousel items' }
  }
}

/**
 * Create a carousel item (database version)
 */
export async function createCarouselItemDB(input: CarouselItemInsert): Promise<DbResult<CarouselItemRow>> {
  try {
    console.log(`[DEBUG] createCarouselItemDB creating:`, input);

    const { data, error } = await supabase
      .from('carousel_items')
      .insert(input)
      .select('*')
      .single()

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Created carousel item:`, data);
    return { data }
  } catch (e) {
    console.log(`[DEBUG] Exception in createCarouselItemDB:`, e);
    return { error: 'Failed to create carousel item' }
  }
}

/**
 * Create a carousel (database version)
 */
export async function createCarouselDB(input: { page: PageType; slug: string; title?: string | null; description?: string | null; is_active?: boolean }): Promise<DbResult<CarouselRow>> {
  try {
    console.log(`[DEBUG] createCarouselDB creating:`, input);

    const { data, error } = await supabase
      .from('carousels')
      .insert({
        page: input.page,
        slug: input.slug,
        title: input.title ?? null,
        description: input.description ?? null,
        is_active: input.is_active ?? true
      })
      .select('*')
      .single()

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Created carousel:`, data);
    return { data }
  } catch (e) {
    console.log(`[DEBUG] Exception in createCarouselDB:`, e);
    return { error: 'Failed to create carousel' }
  }
}

/**
 * Update a carousel item (database version)
 */
export async function updateCarouselItemDB(id: string, input: Partial<CarouselItemInsert>): Promise<DbResult<CarouselItemRow>> {
  try {
    console.log(`[DEBUG] updateCarouselItemDB updating item: ${id}`, input);

    const { data, error } = await supabase
      .from('carousel_items')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Updated carousel item:`, data);
    return { data }
  } catch (e) {
    console.log(`[DEBUG] Exception in updateCarouselItemDB:`, e);
    return { error: 'Failed to update carousel item' }
  }
}

/**
 * Delete a carousel item (database version)
 */
export async function deleteCarouselItemDB(id: string): Promise<DbResult<null>> {
  try {
    console.log(`[DEBUG] deleteCarouselItemDB deleting item: ${id}`);

    const { error } = await supabase
      .from('carousel_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Deleted carousel item: ${id}`);
    return { data: null }
  } catch (e) {
    console.log(`[DEBUG] Exception in deleteCarouselItemDB:`, e);
    return { error: 'Failed to delete carousel item' }
  }
}

/**
 * Update a carousel (database version)
 */
export async function updateCarouselDB(id: string, input: { title?: string | null; description?: string | null; is_active?: boolean }): Promise<DbResult<CarouselRow>> {
  try {
    console.log(`[DEBUG] updateCarouselDB updating carousel: ${id}`, input);

    const { data, error } = await supabase
      .from('carousels')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Updated carousel:`, data);
    return { data }
  } catch (e) {
    console.log(`[DEBUG] Exception in updateCarouselDB:`, e);
    return { error: 'Failed to update carousel' }
  }
}

/**
 * Delete a carousel (database version)
 */
export async function deleteCarouselDB(id: string): Promise<DbResult<null>> {
  try {
    console.log(`[DEBUG] deleteCarouselDB deleting carousel: ${id}`);

    const { error } = await supabase
      .from('carousels')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(`[DEBUG] Supabase error:`, error);
      return { error: error.message }
    }

    console.log(`[DEBUG] Deleted carousel: ${id}`);
    return { data: null }
  } catch (e) {
    console.log(`[DEBUG] Exception in deleteCarouselDB:`, e);
    return { error: 'Failed to delete carousel' }
  }
}