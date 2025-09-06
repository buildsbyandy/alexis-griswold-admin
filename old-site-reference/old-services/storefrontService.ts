export type StorefrontStatus = 'draft' | 'published' | 'archived';

export interface StorefrontProduct {
	id: string;
	title: string; // required
	slug: string; // unique, editable
	category: 'food' | 'healing' | 'home' | 'personal-care'; // required
	amazonUrl: string; // required
	image: string; // required (path or URL)
	imageAlt: string; // required
	noteShort: string; // required (2–4 lines in UI)
	noteLong?: string;
	tags: string[];
	isAlexisPick: boolean;
	showInFavorites: boolean;
	status: StorefrontStatus; // draft/published/archived
	sortWeight: number; // ordering within category; lower comes first
	usedIn: { type: 'recipe' | 'video'; slug: string; title?: string }[];
	pairsWith: string[]; // product slugs (max 3 used in UI)
	createdAt: string; // ISO string
	updatedAt: string; // ISO string
	// Optional lightweight analytics counters (not persisted across imports necessarily)
	clicks30d?: number;
}

interface StorefrontStats {
	total: number;
	byStatus: Record<StorefrontStatus, number>;
	byCategory: Record<string, number>;
	favorites: number;
}

class StorefrontService {
	private readonly STORAGE_KEY = 'adminStorefrontProducts';

	// ---- Core getters ----
	getAll(): StorefrontProduct[] {
		const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
		if (!raw) return [];
		try {
			const parsed: StorefrontProduct[] = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	getPublished(): StorefrontProduct[] {
		return this.getAll().filter(p => p.status === 'published');
	}

	getFavorites(): StorefrontProduct[] {
		return this.getPublished()
			.filter(p => p.showInFavorites)
			.sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
	}

	getByCategory(category: StorefrontProduct['category'], opts?: { includeDraft?: boolean }): StorefrontProduct[] {
		const list = this.getAll()
			.filter(p => p.category === category && (opts?.includeDraft ? p.status !== 'archived' : p.status === 'published'))
			.sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
		return list;
	}

	findBySlug(slug: string): StorefrontProduct | undefined {
		return this.getAll().find(p => p.slug === slug);
	}

	// ---- Validation ----
	validateRequired(p: Partial<StorefrontProduct>) {
		const errors: Record<string, string> = {};
		if (!p.title || !(p.title + '').trim()) errors.title = 'Title is required';
		if (!p.category) errors.category = 'Category is required';
		if (!p.amazonUrl || !(p.amazonUrl + '').trim()) errors.amazonUrl = 'Amazon URL is required';
		if (!p.image || !(p.image + '').trim()) errors.image = 'Image is required';
		if (!p.imageAlt || !(p.imageAlt + '').trim()) errors.imageAlt = 'Image alt text is required';
		if (!p.noteShort || !(p.noteShort + '').trim()) errors.noteShort = 'Short note is required';
		if (p.title && (p.title + '').length > 120) errors.title = 'Title is too long (max 120)';
		if (p.slug && (p.slug + '').length > 140) errors.slug = 'Slug is too long (max 140)';
		if (p.noteShort && (p.noteShort + '').length > 280) errors.noteShort = 'Short note is too long (max 280)';
		return errors;
	}

	// ---- Mutations ----
	add(input: Omit<StorefrontProduct, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string }): StorefrontProduct {
		const now = new Date().toISOString();
		const partial: Partial<StorefrontProduct> = {
			...input,
			slug: input.slug || this.slugify(input.title),
		};
		const errors = this.validateRequired(partial);
		if (Object.keys(errors).length) {
			throw Object.assign(new Error('Validation failed'), { errors });
		}
		const products = this.getAll();
		const uniqueSlug = this.ensureUniqueSlug(partial.slug!);
		const product: StorefrontProduct = {
			...(partial as StorefrontProduct),
			id: this.generateId(),
			slug: uniqueSlug,
			tags: partial.tags || [],
			isAlexisPick: !!partial.isAlexisPick,
			showInFavorites: !!partial.showInFavorites,
			status: partial.status || 'draft',
			sortWeight: typeof partial.sortWeight === 'number' ? partial.sortWeight : this.nextSortWeightForCategory(partial.category as any),
			usedIn: partial.usedIn || [],
			pairsWith: partial.pairsWith || [],
			createdAt: now,
			updatedAt: now,
		};
		products.push(product);
		this.save(products);
		try { (window as any)?.analytics?.track?.('sf_admin_create'); } catch {}
		return product;
	}

	update(id: string, updates: Partial<StorefrontProduct>): StorefrontProduct {
		const products = this.getAll();
		const idx = products.findIndex(p => p.id === id);
		if (idx === -1) throw new Error('Product not found');
		const prev = products[idx];
		const merged = { ...prev, ...updates } as StorefrontProduct;
		// if slug changed, ensure unique
		if (updates.slug && updates.slug !== prev.slug) {
			merged.slug = this.ensureUniqueSlug(this.slugify(updates.slug));
		}
		// if category changed and sortWeight missing, assign next sort
		if (updates.category && updates.category !== prev.category && updates.sortWeight == null) {
			merged.sortWeight = this.nextSortWeightForCategory(updates.category as any);
		}
		const errors = this.validateRequired(merged);
		if (Object.keys(errors).length) {
			throw Object.assign(new Error('Validation failed'), { errors });
		}
		merged.updatedAt = new Date().toISOString();
		products[idx] = merged;
		this.save(products);
		try { (window as any)?.analytics?.track?.('sf_admin_update'); } catch {}
		return merged;
	}

	archive(id: string): void {
		this.update(id, { status: 'archived' });
	}

	delete(id: string): void {
		const products = this.getAll();
		const next = products.filter(p => p.id !== id);
		this.save(next);
	}

	reorderWithinCategory(category: StorefrontProduct['category'], orderedIds: string[]): void {
		const all = this.getAll();
		const inCat = all.filter(p => p.category === category);
		const idToIndex = new Map<string, number>();
		orderedIds.forEach((id, i) => idToIndex.set(id, i));
		const base = Math.min(...inCat.map(p => p.sortWeight || 0), 0);
		for (const p of all) {
			if (p.category !== category) continue;
			const idx = idToIndex.get(p.id);
			if (idx == null) continue;
			p.sortWeight = base + idx;
			p.updatedAt = new Date().toISOString();
		}
		this.save(all);
		try { (window as any)?.analytics?.track?.('sf_admin_reorder'); } catch {}
	}

	// ---- Import / Export ----
	export(): string {
		return JSON.stringify(this.getAll(), null, 2);
	}

	import(jsonData: string): void {
		let arr: unknown;
		try {
			arr = JSON.parse(jsonData);
		} catch (e) {
			throw new Error('Invalid JSON');
		}
		if (!Array.isArray(arr)) throw new Error('Expected an array of products');
		const validated: StorefrontProduct[] = [];
		for (const item of arr) {
			const p = item as Partial<StorefrontProduct>;
			const errors = this.validateRequired(p);
			if (Object.keys(errors).length) {
				throw Object.assign(new Error('Validation failed'), { errors, item: p });
			}
			// Coerce dates and ids
			const id = p.id || this.generateId();
			const createdAt = p.createdAt || new Date().toISOString();
			const updatedAt = p.updatedAt || createdAt;
			validated.push({
				id: id as string,
				title: p.title!,
				slug: this.ensureUniqueSlug(this.slugify(p.slug || p.title!)),
				category: p.category as any,
				amazonUrl: p.amazonUrl!,
				image: p.image!,
				imageAlt: p.imageAlt!,
				noteShort: p.noteShort!,
				noteLong: p.noteLong,
				tags: p.tags || [],
				isAlexisPick: !!p.isAlexisPick,
				showInFavorites: !!p.showInFavorites,
				status: (p.status as StorefrontStatus) || 'draft',
				sortWeight: typeof p.sortWeight === 'number' ? p.sortWeight : this.nextSortWeightForCategory(p.category as any),
				usedIn: p.usedIn || [],
				pairsWith: p.pairsWith || [],
				createdAt,
				updatedAt,
				clicks30d: p.clicks30d || 0,
			});
		}
		this.save(validated);
	}

	// ---- Stats ----
	getStats(): StorefrontStats {
		const all = this.getAll();
		const byStatus: StorefrontStats['byStatus'] = { draft: 0, published: 0, archived: 0 };
		const byCategory: Record<string, number> = {};
		let favorites = 0;
		for (const p of all) {
			byStatus[p.status] = (byStatus[p.status] || 0) + 1;
			byCategory[p.category] = (byCategory[p.category] || 0) + 1;
			if (p.showInFavorites && p.status === 'published') favorites++;
		}
		return { total: all.length, byStatus, byCategory, favorites };
	}

	// ---- Search ----
	search(query: string, opts?: { category?: string; publishedOnly?: boolean }): StorefrontProduct[] {
		const s = (query || '').trim().toLowerCase();
		if (s.length < 2) return [];
		let list = this.getAll();
		if (opts?.publishedOnly) list = list.filter(p => p.status === 'published');
		if (opts?.category) list = list.filter(p => p.category === opts.category);
		return list.filter(p =>
			p.title.toLowerCase().includes(s) ||
			(p.noteShort || '').toLowerCase().includes(s) ||
			(p.category || '').toLowerCase().includes(s) ||
			(p.tags || []).some(t => (t || '').toLowerCase().includes(s))
		);
	}

	// ---- Helpers ----
	private save(list: StorefrontProduct[]) {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
	}

	private generateId() {
		return 'sf_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
	}

	slugify(input: string) {
		return (input || '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)+/g, '');
	}

	private ensureUniqueSlug(base: string): string {
		const all = this.getAll();
		let slug = base;
		let i = 1;
		const existing = new Set(all.map(p => p.slug));
		while (existing.has(slug)) {
			slug = `${base}-${i++}`;
		}
		return slug;
	}

	private nextSortWeightForCategory(category: StorefrontProduct['category']): number {
		const all = this.getAll().filter(p => p.category === category);
		if (!all.length) return 0;
		return Math.max(...all.map(p => p.sortWeight || 0)) + 1;
	}

	// Seed from static data if storage empty (one-time convenience)
	seedFromStatic(staticList: Array<any>) {
		if (this.getAll().length) return;
		const now = new Date().toISOString();
		const mapped: StorefrontProduct[] = (staticList || []).map((s: any, idx: number) => ({
			id: this.generateId(),
			title: s.name || s.title || 'Untitled',
			slug: this.ensureUniqueSlug(this.slugify(s.name || s.title || `item-${idx}`)),
			category: (s.category as any) || 'food',
			amazonUrl: s.link || s.url || '#',
			image: s.image || '',
			imageAlt: s.name || s.title || 'Product image',
			noteShort: s.tagline || '',
			noteLong: '',
			tags: Array.isArray(s.tags) ? s.tags : [],
			isAlexisPick: !!s.featured,
			showInFavorites: !!s.featured,
			status: 'published',
			sortWeight: idx,
			usedIn: [],
			pairsWith: [],
			createdAt: now,
			updatedAt: now,
			clicks30d: 0,
		}));
		this.save(mapped);
	}

  // Force restore: overwrite with provided static list (demo/sample restore)
  restoreFromStatic(staticList: Array<any>) {
    const now = new Date().toISOString();
    const mapped: StorefrontProduct[] = (staticList || []).map((s: any, idx: number) => ({
      id: this.generateId(),
      title: s.name || s.title || 'Untitled',
      slug: this.ensureUniqueSlug(this.slugify(s.name || s.title || `item-${idx}`)),
      category: (s.category as any) || 'food',
      amazonUrl: s.link || s.url || '#',
      image: s.image || '',
      imageAlt: s.name || s.title || 'Product image',
      noteShort: s.tagline || '',
      noteLong: '',
      tags: Array.isArray(s.tags) ? s.tags : [],
      isAlexisPick: !!s.featured,
      showInFavorites: !!s.featured,
      status: 'published',
      sortWeight: idx,
      usedIn: [],
      pairsWith: [],
      createdAt: now,
      updatedAt: now,
      clicks30d: 0,
    }));
    this.save(mapped);
  }
}

export const storefrontService = new StorefrontService();
export default storefrontService;


