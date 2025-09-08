'use server';

import { StorefrontProductFormSchema, type StorefrontProductFormData, type StorefrontProductPayload, type StorefrontProduct } from '../types/storefront';
import { slugify, generateUniqueSlug } from '../utils/storefront';
import supabaseAdmin from '../supabase/admin';

/**
 * Server action to upsert a storefront product
 * @param formData - The form data from the modal
 * @param productId - Optional product ID for updates
 * @returns The created or updated product
 */
export async function upsertStorefrontProduct(
  formData: StorefrontProductFormData, 
  productId?: string
): Promise<{ success: true; product: StorefrontProduct } | { success: false; error: string }> {
  try {
    // Validate the form data
    const validatedData = StorefrontProductFormSchema.parse(formData);
    
    // Generate slug if not provided
    let slug = validatedData.slug;
    if (!slug) {
      // Get existing slugs to ensure uniqueness
      const { data: existingProducts } = await supabaseAdmin
        .from('storefront_products')
        .select('slug')
        .neq('id', productId || ''); // Exclude current product if updating
        
      const existingSlugs = existingProducts?.map(p => p.slug).filter(Boolean) || [];
      slug = generateUniqueSlug(validatedData.product_title, existingSlugs);
    }

    // Prepare the payload for database insertion/update
    const payload: StorefrontProductPayload = {
      product_title: validatedData.product_title,
      slug,
      category_name: validatedData.category_name,
      status: validatedData.status,
      sortWeight: validatedData.sortWeight,
      amazon_url: validatedData.amazon_url,
      price: validatedData.price,
      product_image_path: validatedData.product_image_path,
      noteShort: validatedData.noteShort || null,
      noteLong: validatedData.noteLong || null,
      tags: validatedData.tags,
      isAlexisPick: validatedData.isAlexisPick,
      is_favorite: validatedData.is_favorite,
      showInFavorites: validatedData.showInFavorites,
    };

    let result;
    
    if (productId) {
      // Update existing product
      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select('*')
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Create new product
      const { data, error } = await supabaseAdmin
        .from('storefront_products')
        .insert(payload)
        .select('*')
        .single();
        
      if (error) throw error;
      result = data;
    }

    return { success: true, product: result as StorefrontProduct };
  } catch (error: any) {
    console.error('Error upserting storefront product:', error);
    
    if (error.errors) {
      // Zod validation error
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    
    if (error.code === '23505') {
      // Unique constraint violation (duplicate slug)
      return { success: false, error: 'Product with this slug already exists' };
    }
    
    if (error.code === '23503') {
      // Foreign key constraint violation
      return { success: false, error: 'Invalid category selected' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to save product' 
    };
  }
}

/**
 * Server action to delete a storefront product
 * @param productId - The product ID to delete
 * @returns Success/failure result
 */
export async function deleteStorefrontProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('storefront_products')
      .delete()
      .eq('id', productId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting storefront product:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete product' 
    };
  }
}

/**
 * Server action to get all storefront categories
 * @returns Array of categories
 */
export async function getStorefrontCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('storefront_categories')
      .select('category_name, category_description, category_image_path, is_featured')
      .order('category_name');
      
    if (error) throw error;
    
    return { success: true, categories: data || [] };
  } catch (error: any) {
    console.error('Error fetching storefront categories:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch categories',
      categories: []
    };
  }
}