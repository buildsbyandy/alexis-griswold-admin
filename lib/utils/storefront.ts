/**
 * Utility functions for storefront operations
 */

/**
 * Generate a URL-safe slug from a string
 * @param input - The string to slugify
 * @returns A URL-safe slug
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

/**
 * Parse price string to number or null
 * @param priceStr - The price string to parse
 * @returns A number or null if invalid/empty
 */
export function parsePrice(priceStr: string | undefined | null): number | null {
  if (!priceStr || priceStr.trim() === '') return null;
  
  const num = Number(priceStr);
  return isFinite(num) ? num : null;
}

/**
 * Format price for display
 * @param price - The numeric price
 * @returns Formatted price string
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '';
  return `$${price.toFixed(2)}`;
}

/**
 * Generate slug with uniqueness check
 * @param title - The product title
 * @param existingSlugs - Array of existing slugs to avoid duplicates
 * @returns A unique slug
 */
export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}