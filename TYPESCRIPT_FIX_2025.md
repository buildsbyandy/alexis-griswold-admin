# TypeScript Error Fix - January 2025

## Problem Summary
After regenerating Supabase types, TypeScript errors appeared because of a mismatch between:
- What the API actually returns (non-prefixed fields: `kind`, `ref_id`, `order_index`, `is_active`)
- What the TypeScript types claim it returns (prefixed fields: `item_kind`, `item_ref_id`, `item_order_index`, `item_is_active`)

## Root Cause
The `listViewItems()` function in `carouselService.ts` claims to return `VCarouselItemRow[]`, which represents the `v_carousel_items` database view with prefixed column names.

However, the API endpoint `/api/carousels/items` has two modes:
1. **With `use_view=true` parameter**: Returns data from `v_carousel_items` view (prefixed: `item_kind`, `item_ref_id`, etc.)
2. **Without `use_view` parameter**: Returns data from `carousel_items` table (non-prefixed: `kind`, `ref_id`, etc.)

The `listViewItems()` function does NOT pass `use_view=true`, so it receives **non-prefixed** data from the `carousel_items` table, not the view.

## Solution

### Change 1: Update `listViewItems()` return type in `lib/services/carouselService.ts`

**Before:**
```typescript
export async function listViewItems(page: PageType, slug?: string): Promise<ServiceResult<VCarouselItemRow[]>>
```

**After:**
```typescript
// Type representing what the API actually returns - carousel items with joined carousel metadata
export type CarouselItemWithMeta = CarouselItemRow & {
  carousel_slug?: string | null;
  carousel_id: string;
}

export async function listViewItems(page: PageType, slug?: string): Promise<ServiceResult<CarouselItemWithMeta[]>>
```

### Change 2: Update references in `lib/services/carouselService.ts`

The `listStorefrontItems` function uses `listViewItems` and accesses prefixed properties. Need to update to non-prefixed:

**Before:**
```typescript
const refIds = viewData.map(v => v.item_ref_id).filter(Boolean) as string[]
// ...
id: v.carousel_item_id!,
order_index: v.item_order_index,
ref_id: v.item_ref_id,
caption: v.item_caption || (p?.product_title ?? null),
```

**After:**
```typescript
const refIds = viewData.map(v => v.ref_id).filter(Boolean) as string[]
// ...
id: v.id,
order_index: v.order_index,
ref_id: v.ref_id,
caption: v.caption || (p?.product_title ?? null),
```

### Change 3: Update `lib/services/playlistService.ts`

The playlist service already uses non-prefixed names correctly, but the type mismatch causes errors. Once the `listViewItems` return type is fixed, the errors should resolve.

Current code (already correct, just needs type fix):
```typescript
const playlistIds = carouselItems
  .filter(item => item.kind === 'playlist' && item.ref_id)  // Already non-prefixed ✓
  .map(item => item.ref_id)
  .filter(Boolean) as string[];
```

### Change 4: Fix `pages/api/vlogs/featured.ts`

Fix null assignment error:

**Line 101:**
```typescript
// Before
const result = await setFeaturedVlog(videoId);

// After
const result = await setFeaturedVlog(videoId || '');
// OR add null check before calling
```

## Files Changed
1. `lib/services/carouselService.ts` - Update `listViewItems` return type and add `CarouselItemWithMeta` type
2. `lib/services/carouselService.ts` - Update `listStorefrontItems` to use non-prefixed property names
3. `pages/api/vlogs/featured.ts` - Fix null type error

## Verification
Run `npx tsc --noEmit` to verify all TypeScript errors are resolved.

## Why This Happened
The previous fix changed the code to use non-prefixed property names (which was correct), but the return type of `listViewItems()` was never updated to match. When Supabase types were regenerated, TypeScript started enforcing the type contract more strictly, revealing this mismatch.
