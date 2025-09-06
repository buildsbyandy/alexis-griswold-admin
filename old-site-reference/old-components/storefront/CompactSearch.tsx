import React, { useEffect, useMemo, useRef, useState } from 'react';
import RichSuggest from './RichSuggest';
import storefrontService from '../../services/storefrontService';
import { searchProducts } from '../../lib/storefront';

export interface StoreProduct {
  id: string;
  title?: string;
  name?: string;
  image: string;
  priceText?: string;
  price?: string;
  category?: string;
  url?: string;
  link?: string;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

interface CompactSearchProps {
  products: StoreProduct[];
}

const CompactSearch: React.FC<CompactSearchProps> = ({ products }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StoreProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sheetInputRef = useRef<HTMLInputElement | null>(null);
  const wasOpenedRef = useRef(false);
  const skipNextFocusRef = useRef(false);

  // Debounce the query and compute results
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }
    setSearching(true);
    setError(null);
    const handle = window.setTimeout(() => {
      try {
        const r = searchProducts(products as any, trimmed);
        setResults(r as any);
      } catch (e) {
        setError('search_failed');
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q, products]);

  // Desktop dropdown open state tracks results
  useEffect(() => {
    const trimmed = q.trim();
    setDesktopOpen(!isMobile && trimmed.length >= 2 && results.length > 0);
  }, [isMobile, q, results.length]);

  // Enter should navigate when no active selection (handled within RichSuggest)
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && q.trim().length >= 2) {
      // navigate to full search page
      window.location.assign(`/storefront/search?q=${encodeURIComponent(q)}`);
    } else if (e.key === 'Escape') {
      if (isMobile) {
        closeSheet();
      } else {
        setDesktopOpen(false);
      }
    }
  };

  // Close on outside click for desktop dropdown
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (inputRef.current && inputRef.current.contains(t)) return;
      setDesktopOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const list = useMemo(() => results.slice(0, 6), [results]);

  // Manage body scroll lock when mobile sheet is open
  useEffect(() => {
    if (!isMobile) return;
    if (sheetOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sheetOpen, isMobile]);

  // Focus management and back button handling
  useEffect(() => {
    if (!isMobile) return;
    if (sheetOpen) {
      wasOpenedRef.current = true;
      // focus the sheet input
      window.setTimeout(() => sheetInputRef.current?.focus(), 0);
      try { (window as any)?.analytics?.track?.('search_open'); } catch {}
      const onPop = () => setSheetOpen(false);
      window.addEventListener('popstate', onPop);
      window.history.pushState({ searchSheet: true }, '');
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
      document.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('popstate', onPop);
        document.removeEventListener('keydown', onKey);
      };
    } else {
      // Only restore focus when closing a sheet that had been opened by the user
      if (wasOpenedRef.current) {
        skipNextFocusRef.current = true;
        inputRef.current?.focus();
        wasOpenedRef.current = false;
        try { (window as any)?.analytics?.track?.('search_close'); } catch {}
      }
    }
  }, [sheetOpen, isMobile]);

  const openSheet = () => {
    if (!isMobile) return;
    setSheetOpen(true);
  };

  const closeSheet = () => {
    if (!isMobile) return;
    setSheetOpen(false);
    try { if (window.history.state?.searchSheet) window.history.back(); } catch {}
  };

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      <label htmlFor="storefront-compact-search" className="sr-only">
        Search products
      </label>
      {/* Search icon */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id="storefront-compact-search"
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          if (!isMobile) return;
          if (skipNextFocusRef.current) { skipNextFocusRef.current = false; return; }
          openSheet();
        }}
        onKeyDown={onKeyDown}
        placeholder="Search all picks…"
        className="w-full rounded-lg border border-[#E6E6E6] bg-white pl-9 pr-4 py-2 text-[#262626] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#A27D4C]"
        aria-autocomplete="list"
        aria-expanded={desktopOpen}
        aria-controls="store-suggest-list"
        role="combobox"
      />

      {/* Desktop overlay suggestions */}
      {!isMobile && desktopOpen && q.trim().length >= 2 && (
        <RichSuggest
          anchorEl={inputRef.current}
          results={list as any}
          query={q}
          onClose={() => setDesktopOpen(false)}
          onOpenQuick={(slug, index) => {
            // open quick-view deep link
            try {
              window.history.pushState({ quickOpen: true }, '');
            } catch {}
            const url = new URL(window.location.href);
            url.searchParams.set('quick', slug);
            window.history.replaceState(window.history.state, '', url.toString());
            try { (window as any)?.analytics?.track?.('sf_quick_view_open', { slug, via: 'suggest', index }); } catch {}
            // Let the page-level handler open the Quick-View component based on ?quick
            const ev = new CustomEvent('storefront:openQuick', { detail: { slug } });
            window.dispatchEvent(ev);
            return true;
          }}
        />
      )}

      {/* Mobile full-screen sheet */}
      {isMobile && sheetOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm">
          <div className="h-full max-w-md mx-auto flex flex-col">
            {/* Sticky header with input and Cancel */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#E6E6E6] px-4 pt-[calc(env(safe-area-inset-top,0px)+10px)] pb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <svg aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={sheetInputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search all picks…"
                  className="w-full h-11 rounded-lg border border-[#E6E6E6] bg-white pl-9 pr-10 text-[#262626] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#A27D4C]"
                  aria-autocomplete="list"
                  aria-controls="store-suggest-list"
                  role="combobox"
                />
                {q && (
                  <button
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-[#6B6B6B] hover:bg-[#F7F4EF]"
                    onClick={() => {
                      setQ('');
                      sheetInputRef.current?.focus();
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <button onClick={closeSheet} className="h-11 min-w-[64px] px-3 rounded-md border border-[#E6E6E6] bg-white text-[#262626]">
                Cancel
              </button>
            </div>

            {/* Results area */}
            <div className="flex-1 overflow-y-auto px-4 py-3" role="listbox" aria-label="Search suggestions" id="store-suggest-list">
              <div aria-live="polite" className="sr-only">
                {searching ? 'Searching…' : results.length ? `${results.length} results` : q.trim().length < 2 ? 'Type to search' : error ? 'Error' : 'No results'}
              </div>

              {q.trim().length < 2 && (
                <div className="text-sm text-[#6B6B6B] py-6">Type to search</div>
              )}
              {q.trim().length >= 2 && searching && (
                <div className="text-sm text-[#6B6B6B] py-6">Searching…</div>
              )}
              {q.trim().length >= 2 && !searching && !error && results.length === 0 && (
                <div className="text-sm text-[#6B6B6B] py-6">No results</div>
              )}
              {error && (
                <div className="text-sm text-[#6B6B6B] py-6">Something went wrong. Please try again.</div>
              )}

              {results.map((p, idx) => {
                const title = p.title || p.name || '';
                const price = (p as any).priceText || (p as any).price;
                return (
                  <a
                    key={p.id}
                    role="option"
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#F7F4EF] cursor-pointer rounded-md"
                    href={`?quick=${encodeURIComponent((p as any).slug || '')}`}
                    onClick={() => {
                      const slug = (p as any).slug;
                      if (slug) {
                        try { window.history.pushState({ quickOpen: true }, ''); } catch {}
                        const url = new URL(window.location.href);
                        url.searchParams.set('quick', slug);
                        window.history.replaceState(window.history.state, '', url.toString());
                        try { (window as any)?.analytics?.track?.('sf_quick_view_open', { slug, via: 'sheet', index: idx }); } catch {}
                        const ev = new CustomEvent('storefront:openQuick', { detail: { slug } });
                        window.dispatchEvent(ev);
                      }
                      closeSheet();
                    }}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded">
                      <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[#262626]">{title}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        {p.category && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E3D4C2] text-[#383B26] truncate max-w-[10rem]">{p.category}</span>
                        )}
                        {price && <span className="text-[#6B6B6B]">{price}</span>}
                      </div>
                    </div>
                  </a>
                );
              })}

              {q.trim().length >= 2 && (
                <a
                  className="mt-2 block px-3 py-3 text-sm hover:bg-[#F7F4EF] cursor-pointer border-t border-[#E6E6E6] rounded-md"
                  href={`/storefront/search?q=${encodeURIComponent(q)}`}
                  onClick={closeSheet}
                >
                  See all results →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactSearch;


