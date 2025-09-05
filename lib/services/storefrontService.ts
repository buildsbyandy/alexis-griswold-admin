export type StorefrontStatus = 'draft' | 'published' | 'archived';

export interface StorefrontProduct {
  id: string;
  title: string;
  slug: string;
  category: 'food' | 'healing' | 'home' | 'personal-care';
  amazonUrl: string;
  image: string;
  imageUrl?: string;
  imageAlt: string;
  noteShort: string;
  noteLong?: string;
  description?: string;
  price?: number;
  tags: string[];
  isAlexisPick: boolean;
  isFavorite?: boolean;
  showInFavorites: boolean;
  status: StorefrontStatus;
  sortWeight: number;
  usedIn: { type: 'recipe' | 'video'; slug: string; title?: string }[];
  pairsWith: string[];
  createdAt: string;
  updatedAt: string;
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
  async getAll(): Promise<StorefrontProduct[]> { 
    try {
      const response = await fetch('/api/storefront');
      if (!response.ok) throw new Error('Failed to fetch storefront products');
      const data = await response.json();
      // Map database fields to service interface
      return (data.products || []).map((p: any) => ({
        id: p.id,
        title: p.product_title || '',
        slug: p.slug || '',
        category: this.mapCategoryFromDB(p.category_name) as any,
        amazonUrl: p.amazon_url || '',
        image: p.product_image_path || '',
        imageAlt: p.imageAlt || p.product_title || '',
        noteShort: p.noteShort || p.product_description || '',
        noteLong: p.noteLong || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        isAlexisPick: p.isAlexisPick || false,
        showInFavorites: p.showInFavorites || false,
        status: p.status as any || 'draft',
        sortWeight: p.sortWeight || 0,
        usedIn: p.usedIn || [],
        pairsWith: Array.isArray(p.pairsWith) ? p.pairsWith : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        clicks30d: p.clicks30d || 0
      }));
    } catch (error) {
      console.error('Error fetching storefront products:', error);
      // Fallback to localStorage for development
      const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
      if(!raw) return []; 
      try { 
        const p: StorefrontProduct[] = JSON.parse(raw); 
        return Array.isArray(p) ? p : []; 
      } catch { 
        return []; 
      }
    }
  }
  async getPublished(): Promise<StorefrontProduct[]> { const all = await this.getAll(); return all.filter(p=>p.status==='published'); }
  async getFavorites(): Promise<StorefrontProduct[]> { const published = await this.getPublished(); return published.filter(p=>p.showInFavorites).sort((a,b)=>(a.sortWeight??0)-(b.sortWeight??0)); }
  async getByCategory(category: StorefrontProduct['category'], opts?: { includeDraft?: boolean }): Promise<StorefrontProduct[]> { const all = await this.getAll(); const list=all.filter(p=>p.category===category && (opts?.includeDraft ? p.status!=='archived' : p.status==='published')).sort((a,b)=>(a.sortWeight??0)-(b.sortWeight??0)); return list; }
  async findBySlug(slug: string): Promise<StorefrontProduct | undefined> { const all = await this.getAll(); return all.find(p=>p.slug===slug); }
  validateRequired(p: Partial<StorefrontProduct>) { const e: Record<string,string>={}; if(!p.title||!(p.title+'').trim()) e.title='Title is required'; if(!p.category) e.category='Category is required'; if(!p.amazonUrl||!(p.amazonUrl+'').trim()) e.amazonUrl='Amazon URL is required'; if(!p.image||!(p.image+'').trim()) e.image='Image is required'; if(!p.imageAlt||!(p.imageAlt+'').trim()) e.imageAlt='Image alt text is required'; if(!p.noteShort||!(p.noteShort+'').trim()) e.noteShort='Short note is required'; if(p.title&&(p.title+'').length>120) e.title='Title is too long (max 120)'; if(p.slug&&(p.slug+'').length>140) e.slug='Slug is too long (max 140)'; if(p.noteShort&&(p.noteShort+'').length>280) e.noteShort='Short note is too long (max 280)'; return e; }
  async add(input: Omit<StorefrontProduct,'id'|'createdAt'|'updatedAt'|'slug'> & { slug?: string }): Promise<StorefrontProduct> { 
    const now = new Date().toISOString(); 
    const partial: Partial<StorefrontProduct> = {...input, slug: input.slug || this.slugify(input.title)}; 
    const errors = this.validateRequired(partial); 
    if(Object.keys(errors).length) throw Object.assign(new Error('Validation failed'),{errors}); 
    
    try {
      // Try API first
      const response = await fetch('/api/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_title: partial.title,
          slug: partial.slug,
          category_name: this.mapCategoryToDB(partial.category as any),
          amazon_url: partial.amazonUrl,
          product_image_path: partial.image,
          imageAlt: partial.imageAlt,
          product_description: partial.noteShort,
          noteLong: partial.noteLong,
          price: partial.price,
          tags: partial.tags || [],
          isAlexisPick: !!partial.isAlexisPick,
          showInFavorites: !!partial.showInFavorites,
          status: partial.status || 'draft',
          sortWeight: typeof partial.sortWeight==='number' ? partial.sortWeight : this.nextSortWeightForCategory(partial.category as any),
          usedIn: partial.usedIn || [],
          pairsWith: partial.pairsWith || []
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return this.mapFromDB(result.product);
      }
    } catch (error) {
      console.error('API create failed, using localStorage fallback:', error);
    }
    
    // Fallback to localStorage
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const products = raw ? JSON.parse(raw) : [];
    
    const uniqueSlug=this.ensureUniqueSlug(partial.slug!); 
    const product: StorefrontProduct = { 
      ...(partial as StorefrontProduct), 
      id:this.generateId(), 
      slug:uniqueSlug, 
      tags: partial.tags || [], 
      isAlexisPick: !!partial.isAlexisPick, 
      showInFavorites: !!partial.showInFavorites, 
      status: partial.status || 'draft', 
      sortWeight: typeof partial.sortWeight==='number' ? partial.sortWeight : this.nextSortWeightForCategory(partial.category as any), 
      usedIn: partial.usedIn || [], 
      pairsWith: partial.pairsWith || [], 
      createdAt: now, 
      updatedAt: now 
    }; 
    products.push(product); 
    this.save(products); 
    return product; 
  }
  async update(id: string, updates: Partial<StorefrontProduct>): Promise<StorefrontProduct> { 
    try {
      // Try API first
      const response = await fetch(`/api/storefront/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_title: updates.title,
          slug: updates.slug,
          category_name: updates.category ? this.mapCategoryToDB(updates.category) : undefined,
          amazon_url: updates.amazonUrl,
          product_image_path: updates.image,
          imageAlt: updates.imageAlt,
          product_description: updates.noteShort,
          noteLong: updates.noteLong,
          price: updates.price,
          tags: updates.tags,
          isAlexisPick: updates.isAlexisPick,
          showInFavorites: updates.showInFavorites,
          status: updates.status,
          sortWeight: updates.sortWeight,
          usedIn: updates.usedIn,
          pairsWith: updates.pairsWith
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return this.mapFromDB(result.product);
      }
    } catch (error) {
      console.error('API update failed, using localStorage fallback:', error);
    }
    
    // Fallback to localStorage
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const products = raw ? JSON.parse(raw) : [];
    const idx=products.findIndex((p: any)=>p.id===id); 
    if(idx===-1) throw new Error('Product not found'); 
    const prev=products[idx]; 
    const merged={...prev,...updates} as StorefrontProduct; 
    if(updates.slug && updates.slug!==prev.slug) merged.slug=this.ensureUniqueSlug(this.slugify(updates.slug)); 
    if(updates.category && updates.category!==prev.category && updates.sortWeight==null) merged.sortWeight=this.nextSortWeightForCategory(updates.category as any); 
    const errors=this.validateRequired(merged); 
    if(Object.keys(errors).length) throw Object.assign(new Error('Validation failed'),{errors}); 
    merged.updatedAt=new Date().toISOString(); 
    products[idx]=merged; 
    this.save(products); 
    return merged; 
  }
  async archive(id: string): Promise<StorefrontProduct> { return this.update(id,{ status:'archived' }); }
  async delete(id: string): Promise<boolean> { 
    try {
      // Try API first
      const response = await fetch(`/api/storefront/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('API delete failed, using localStorage fallback:', error);
    }
    
    // Fallback to localStorage
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const next = raw ? JSON.parse(raw).filter((p: any)=>p.id!==id) : [];
    this.save(next); 
    return true;
  }
  reorderWithinCategory(category: StorefrontProduct['category'], orderedIds: string[]): void { 
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const all = raw ? JSON.parse(raw) : [];
    const inCat=all.filter((p: any)=>p.category===category); 
    const idToIndex=new Map<string,number>(); 
    orderedIds.forEach((id,i)=>idToIndex.set(id,i)); 
    const base=Math.min(...inCat.map((p: any)=>p.sortWeight||0),0); 
    for(const p of all){ 
      if(p.category!==category) continue; 
      const idx=idToIndex.get(p.id); 
      if(idx==null) continue; 
      p.sortWeight=base+idx; 
      p.updatedAt=new Date().toISOString(); 
    } 
    this.save(all); 
  }
  export(): string { 
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    return JSON.stringify(raw ? JSON.parse(raw) : [], null, 2); 
  }
  import(jsonData: string): void { let arr: unknown; try { arr=JSON.parse(jsonData); } catch { throw new Error('Invalid JSON'); } if(!Array.isArray(arr)) throw new Error('Expected an array of products'); const validated: StorefrontProduct[]=[]; for (const item of arr){ const p=item as Partial<StorefrontProduct>; const errors=this.validateRequired(p); if(Object.keys(errors).length) throw Object.assign(new Error('Validation failed'),{errors,item:p}); const id=p.id||this.generateId(); const createdAt=p.createdAt||new Date().toISOString(); const updatedAt=p.updatedAt||createdAt; validated.push({ id: id as string, title: p.title!, slug: this.ensureUniqueSlug(this.slugify(p.slug || p.title!)), category: p.category as any, amazonUrl: p.amazonUrl!, image: p.image!, imageAlt: p.imageAlt!, noteShort: p.noteShort!, noteLong: p.noteLong, tags: p.tags || [], isAlexisPick: !!p.isAlexisPick, showInFavorites: !!p.showInFavorites, status: (p.status as StorefrontStatus) || 'draft', sortWeight: typeof p.sortWeight==='number' ? p.sortWeight : this.nextSortWeightForCategory(p.category as any), usedIn: p.usedIn || [], pairsWith: p.pairsWith || [], createdAt, updatedAt, clicks30d: p.clicks30d || 0 }); } this.save(validated); }
  async getStats(): Promise<StorefrontStats> { const all=await this.getAll(); const byStatus: StorefrontStats['byStatus']={ draft:0,published:0,archived:0 }; const byCategory: Record<string,number>={}; let favorites=0; for(const p of all){ byStatus[p.status]=(byStatus[p.status]||0)+1; byCategory[p.category]=(byCategory[p.category]||0)+1; if(p.showInFavorites && p.status==='published') favorites++; } return { total: all.length, byStatus, byCategory, favorites }; }
  private save(list: StorefrontProduct[]) { if (typeof localStorage==='undefined') return; localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list)); }
  private generateId() { return 'sf_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36); }
  slugify(input: string) { return (input||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,''); }
  private mapCategoryFromDB(dbCategory: string): string {
    // Map database category names to service category names
    const mapping: Record<string, string> = {
      'Food': 'food',
      'Healing': 'healing', 
      'Home': 'home',
      'Personal Care': 'personal-care'
    };
    return mapping[dbCategory] || 'home';
  }
  private mapCategoryToDB(category: string): string {
    // Map service category names to database category names
    const mapping: Record<string, string> = {
      'food': 'Food',
      'healing': 'Healing',
      'home': 'Home',
      'personal-care': 'Personal Care'
    };
    return mapping[category] || 'Home';
  }
  private mapFromDB(dbProduct: any): StorefrontProduct {
    return {
      id: dbProduct.id,
      title: dbProduct.product_title || '',
      slug: dbProduct.slug || '',
      category: this.mapCategoryFromDB(dbProduct.category_name) as any,
      amazonUrl: dbProduct.amazon_url || '',
      image: dbProduct.product_image_path || '',
      imageUrl: dbProduct.product_image_path,
      imageAlt: dbProduct.imageAlt || dbProduct.product_title || '',
      noteShort: dbProduct.noteShort || dbProduct.product_description || '',
      noteLong: dbProduct.noteLong || '',
      description: dbProduct.product_description,
      price: dbProduct.price,
      tags: Array.isArray(dbProduct.tags) ? dbProduct.tags : [],
      isAlexisPick: dbProduct.isAlexisPick || false,
      isFavorite: dbProduct.showInFavorites || false,
      showInFavorites: dbProduct.showInFavorites || false,
      status: dbProduct.status as any || 'draft',
      sortWeight: dbProduct.sortWeight || 0,
      usedIn: dbProduct.usedIn || [],
      pairsWith: Array.isArray(dbProduct.pairsWith) ? dbProduct.pairsWith : [],
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at,
      clicks30d: dbProduct.clicks30d || 0
    };
  }
  private ensureUniqueSlug(base: string): string { 
    // Use localStorage for slug generation for now
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const all = raw ? JSON.parse(raw) : [];
    let slug=base; let i=1; const existing=new Set(all.map((p: any)=>p.slug)); while(existing.has(slug)){ slug=`${base}-${i++}`; } return slug; 
  }
  private nextSortWeightForCategory(category: StorefrontProduct['category']): number { 
    // Use localStorage for sort weight calculation for now
    const raw = typeof localStorage!=='undefined' ? localStorage.getItem(this.STORAGE_KEY):null; 
    const all = raw ? JSON.parse(raw).filter((p: any)=>p.category===category) : [];
    if(!all.length) return 0; return Math.max(...all.map((p: any)=>p.sortWeight||0))+1; 
  }
}

export const storefrontService = new StorefrontService();
export default storefrontService;

