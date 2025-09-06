import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ModalCard from '../../components/ModalCard';
import CompactSearch from '../../components/storefront/CompactSearch';
import { products as seedProducts } from '../../data/storefrontData';
import { allCategories, buildAmazonUrl, filterByCategories, searchProducts, sortProducts } from '../../lib/storefront';
import storefrontService from '../../services/storefrontService';
import QuickView from '../../components/storefront/QuickView';
import { useEffect, useState } from 'react';

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const catsParam = params.getAll('cats');
  // also accept comma-separated list in `cats`
  const cats = catsParam.length ? catsParam.flatMap((v) => v.split(',')).filter(Boolean) : [];
  const sort = (params.get('sort') as 'relevance' | 'az' | 'new') || 'relevance';

  const [products, setProducts] = useState<any[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const quickItem = useMemo(() => (quickSlug ? storefrontService.findBySlug(quickSlug) : undefined), [quickSlug]);

  useEffect(() => {
    storefrontService.seedFromStatic(seedProducts as any);
    setProducts(storefrontService.getPublished() as any);
    const onOpen = (e: any) => setQuickSlug(e?.detail?.slug || null);
    window.addEventListener('storefront:openQuick', onOpen as any);
    const u = new URL(window.location.href);
    const s = u.searchParams.get('quick');
    if (s) setQuickSlug(s);
    return () => window.removeEventListener('storefront:openQuick', onOpen as any);
  }, []);

  const matches = useMemo(() => {
    const m = searchProducts(products, q);
    const f = filterByCategories(m, cats);
    return sortProducts(f, sort);
  }, [products, q, cats.join(','), sort]);

  const toggleCat = (c: string) => {
    const current = params.getAll('cats');
    let next: string[] = current.flatMap((v) => v.split(',').filter(Boolean));
    if (next.includes(c)) next = next.filter((x) => x !== c);
    else next.push(c);
    const newParams = new URLSearchParams(params.toString());
    newParams.delete('cats');
    next.forEach((v) => newParams.append('cats', v));
    setParams(newParams, { replace: true });
  };

  const setSort = (s: 'relevance' | 'az' | 'new') => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set('sort', s);
    setParams(newParams, { replace: true });
  };

  return (
    <main className="theme-storefront">
      <div className="font-brand-body">
      {/* White hero header */}
      <section className="w-full bg-[var(--band-hero)] text-[var(--body)] border-t border-[var(--hairline)]">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--heading)]">Results for “{q}”</h1>
          <p className="mt-1 text-[var(--muted)]">{matches.length} items · filter by category</p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-4 py-6">
      <nav className="mb-4" aria-label="Back navigation">
        <Link to="/storefront" className="inline-flex items-center text-[var(--muted)] hover:text-[var(--heading)] font-medium underline">
          <span aria-hidden="true" className="mr-2">&#8592;</span> Back to Storefront
        </Link>
      </nav>
      <div className="max-w-md mx-auto mb-6">
        <CompactSearch products={products as any} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {allCategories.map((c) => (
          <button
            key={c}
            className="px-3 py-1.5 rounded-full bg-[var(--chip-bg)] text-[var(--chip-fg)] data-[active=true]:ring-1 data-[active=true]:ring-[var(--dot-active)]"
            data-active={cats.includes(c)}
            onClick={() => toggleCat(c)}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto">
          <label className="mr-2 text-sm text-[var(--muted)]">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-md border border-[var(--hairline)] bg-white px-2 py-1.5 text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="az">A–Z</option>
            <option value="new">Newest</option>
          </select>
        </div>
      </div>

      {matches.length ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {matches.map((p: any, i: number) => (
            <div
              key={p.id}
              onClick={() => {
                try {
                  (window as any)?.analytics?.track?.('search_page_click', { q, item_id: p.id });
                } catch {}
              }}
            >
              <ModalCard
                variant="product"
                title={p.title || p.name}
                imageSrc={p.image}
                blurb={p.blurb || p.tagline}
                 // No direct Amazon click here; open Quick-View via button below
                badges={{ price: p.priceText || p.price, category: p.category }}
              />
               <div className="px-2 mt-2">
                 <button
                   type="button"
                   onClick={() => {
                     const slug = (p as any).slug;
                     if (slug) {
                       try { window.history.pushState({ quickOpen: true }, ''); } catch {}
                       const url = new URL(window.location.href);
                       url.searchParams.set('quick', slug);
                       window.history.replaceState(window.history.state, '', url.toString());
                       setQuickSlug(slug);
                     }
                   }}
                   className="w-full inline-flex items-center justify-center rounded-md bg-[#F7A81B] hover:bg-[#E3960A] text-[#262626] font-semibold h-9 text-sm"
                 >
                   Quick View
                 </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-[var(--hairline)] bg-white p-8 text-center">
          <p className="text-lg font-medium text-[#262626]">No results</p>
          <p className="mt-1 text-[var(--muted)]">Try a different term or browse by category.</p>
        </div>
      )}
      </div>
      </div>
      {quickItem && (
        <QuickView
          product={quickItem}
          onClose={() => {
            setQuickSlug(null);
            try { if (window.history.state?.quickOpen) window.history.back(); } catch {}
          }}
        />
      )}
    </main>
  );
};

export default SearchPage;


