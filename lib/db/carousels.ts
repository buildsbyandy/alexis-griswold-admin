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