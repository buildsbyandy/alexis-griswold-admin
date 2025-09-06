import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SupabaseStorefrontService } from '../../lib/database/supabaseService';
import type { StorefrontProduct, StorefrontCategory } from '../../types/database';
import QuickView from '../../components/storefront/QuickView';
import TestimonialCarousel from '../../components/TestimonialCarousel';
import { mostClicked, buildAmazonUrl } from '../../lib/storefront';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

console.log('CategoryPage mounted');

// Placeholder ProductFilterBar component
const ProductFilterBar: React.FC<{
  search: string;
  setSearch: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  tags: string[];
  selectedTag: string;
  setSelectedTag: (t: string) => void;
}> = ({ search, setSearch, sort, setSort, tags, selectedTag, setSelectedTag }) => (
  <form className="flex flex-wrap items-center gap-2 mb-6" role="search" aria-label="Product filter bar">
    <input
      type="search"
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Search products..."
      className="px-3 py-2 rounded border border-[var(--hairline)] focus:ring-2 focus:ring-black"
      aria-label="Search products"
    />
    <select
      value={sort}
      onChange={e => setSort(e.target.value)}
      className="px-3 py-2 rounded border border-[var(--hairline)] focus:ring-2 focus:ring-black"
      aria-label="Sort products"
    >
      <option value="az">A-Z</option>
      <option value="price">Price: Low to High</option>
    </select>
    {tags.length > 0 && (
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className={`px-3 py-1 rounded-full border ${selectedTag === '' ? 'bg-[var(--chip-bg)] text-[var(--chip-fg)]' : 'bg-[var(--chip-bg)] text-[var(--chip-fg)]'}`}
          onClick={() => setSelectedTag('')}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            type="button"
            className={`px-3 py-1 rounded-full border ${selectedTag === tag ? 'bg-[var(--chip-bg)] text-[var(--chip-fg)] ring-1 ring-[var(--dot-active)]' : 'bg-[var(--chip-bg)] text-[var(--chip-fg)]'}`}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </button>
        ))}
        <button
          type="button"
           className="ml-2 px-3 py-1 rounded-full border bg-white text-[#262626] hover:bg-[#f3f3f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A27D4C]"
          onClick={() => {
            setSearch('');
            setSort('az');
            setSelectedTag('');
          }}
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      </div>
    )}
  </form>
);

import ModalCard from '../../components/ModalCard';

// ProductGrid component using ModalCard product variant (portrait)
const ProductGrid: React.FC<{ products: typeof products }> = ({ products }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {products.map(product => (
      <div key={product.id} className="w-full">
        <ModalCard
          variant="product"
          title={product.name}
          imageSrc={product.image}
          blurb={product.tagline}
          // omit href so we can render a page-scoped CTA below with specific classes
          badges={{ price: product.price, category: product.category }}
          aspect="portrait"
        />
        {product.featured && (
          <div className="px-2 mt-1">
            <span className="inline-flex items-center rounded-md bg-[#A27D4C] text-white text-xs px-2 py-0.5">Alexis’ Pick</span>
          </div>
        )}
        <div className="px-2">
          <a
            href={product.link}
            target="_blank"
            rel="nofollow noopener"
            aria-label={`View on Amazon: ${product.name}`}
            className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-[#F7A81B] hover:bg-[#E3960A] text-[#262626] font-semibold py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A27D4C]"
          >
            View on Amazon
          </a>
        </div>
      </div>
    ))}
  </div>
);

const CategoryPage: React.FC = () => {
  const { category: categoryId } = useParams<{ category: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [category, setCategory] = useState<StorefrontCategory | null>(null);
  const [allProducts, setAllProducts] = useState<StorefrontProduct[]>([]);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load category and its products in parallel
        const [categories, products] = await Promise.all([
          new SupabaseStorefrontService().getCategories(),
          new SupabaseStorefrontService().getProductsByCategory(categoryId || 'food')
        ]);

        const matchingCategory = categories.find(cat => cat.id === categoryId);
        if (!matchingCategory) {
          throw new Error(`Category "${categoryId}" not found`);
        }

        setCategory(matchingCategory);
        setAllProducts(products);

        // Deep-link support
        const url = new URL(window.location.href);
        const s = url.searchParams.get('quick');
        if (s) setQuickSlug(s);
      } catch (err) {
        console.error('Error loading category data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load category data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  // Get featured products and tags
  const topPicks = useMemo(() => 
    allProducts.filter(p => p.is_favorite).slice(0, 3)
  , [allProducts]);

  const allTags = useMemo(() => 
    Array.from(new Set(allProducts.flatMap(p => p.tags || [])))
  , [allProducts]);

  // Filter/sort state
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('az');
  const [selectedTag, setSelectedTag] = useState('');

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags && p.tags.includes(selectedTag));
    }
    if (sort === 'az') {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '') || 0);
    } else if (sort === 'price') {
      filtered = [...filtered].sort((a, b) => {
        const priceA = parseFloat((a.price || '0').replace(/[^\d.]/g, '')) || 0;
        const priceB = parseFloat((b.price || '0').replace(/[^\d.]/g, '')) || 0;
        return priceA - priceB;
      });
    }
    return filtered;
  }, [allProducts, search, sort, selectedTag]);

  if (loading) {
    return (
      <main className="theme-storefront w-screen min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="theme-storefront w-screen min-h-screen flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={() => window.location.reload()}
        />
      </main>
    );
  }

  if (!category) {
    return (
      <main className="theme-storefront w-screen min-h-screen flex flex-col items-center justify-center bg-white font-serif px-4 text-black">
        <h1 className="mb-4 font-serif text-3xl font-semibold text-center text-black md:text-4xl">
          Category not found. Return to the Storefront.
        </h1>
        <Link to="/storefront" className="underline text-blue-600 hover:text-black">
          Back to Storefront
        </Link>
      </main>
    );
  }

  return (
    <main className="theme-storefront w-screen min-h-screen text-[var(--body)] font-serif flex flex-col items-center px-0">
      {/* Debug info */}
      <div className="w-full bg-red-100 p-2 text-center text-sm">
        <p>CategoryPage loaded! Category: {categoryId} | Products: {allProducts.length}</p>
      </div>
      <div className="font-brand-body w-full">
      {/* White hero header */}
      <section className="w-full bg-[var(--band-hero)] text-[var(--body)] border-t border-[var(--hairline)]">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="mb-1 font-serif text-3xl font-semibold text-[var(--heading)] md:text-4xl">{category.name}</h1>
          <p className="text-[var(--muted)]">{category.description}</p>
        </div>
      </section>
      <nav className="w-full max-w-4xl mx-auto mt-6 mb-2 px-4" aria-label="Back navigation">
        <Link to="/storefront" className="inline-flex items-center text-[var(--muted)] hover:text-[var(--heading)] font-medium underline">
          <span aria-hidden="true" className="mr-2">&#8592;</span> Back to Storefront
        </Link>
      </nav>
      
      {/* (a) Top Picks */}
      {topPicks.length > 0 && (
        <section className="w-full max-w-4xl mx-auto py-8 bg-[var(--band-hero)] border-b border-[var(--hairline)]">
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--heading)]">Top Picks</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {topPicks.map((p: any, i: number) => (
              <div className="product-card bg-white rounded-xl p-2">
                <ModalCard
                key={p.id}
                variant="product"
                title={p.name || p.title}
                imageSrc={p.image}
                blurb={p.tagline || p.blurb}
                href={buildAmazonUrl(p.amazonUrl || p.link || p.url, { subtag: `cat-top-${i}` })}
                badges={{ price: p.price || p.priceText, category: p.category, pick: true }}
                aspect="portrait"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* (b) Most Clicked */}
      {clicked.length > 0 && (
        <section className="w-full max-w-4xl mx-auto py-8 bg-[var(--band-hero)] border-b border-[var(--hairline)]">
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--heading)]">Most Clicked</h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {clicked.map((p: any, i: number) => (
              <div className="product-card bg-white rounded-xl p-2">
                <ModalCard
                key={p.id}
                variant="product"
                title={p.name || p.title}
                imageSrc={p.image}
                blurb={p.tagline || p.blurb}
                href={buildAmazonUrl(p.amazonUrl || p.link || p.url, { subtag: `cat-click-${i}` })}
                badges={{ price: p.price || p.priceText, category: p.category }}
                aspect="portrait"
                />
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Testimonial Carousel */}
      <TestimonialCarousel products={allProducts} title="What People Are Saying" />
      {/* Filter Bar */}
      <ProductFilterBar
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        tags={allTags}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
      />
      {/* (c) All items */}
      <section className="w-full max-w-4xl mx-auto py-8 bg-[var(--band-hero)]">
        <h2 className="font-serif text-2xl md:text-3xl text-[var(--heading)]">All items</h2>
          <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="w-full product-card bg-white rounded-xl p-2">
                <ModalCard
                  variant="product"
                  title={product.name || (product as any).title}
                  imageSrc={product.image}
                  blurb={product.tagline || (product as any).noteShort}
                  badges={{ price: (product as any).price || (product as any).priceText, category: product.category }}
                  aspect="portrait"
                />
                {product.featured && (
                  <div className="px-2 mt-1">
                    <span className="inline-flex items-center rounded-md bg-[var(--chip-bg)] text-[var(--chip-fg)] text-xs px-2 py-0.5">Alexis’ Pick</span>
                  </div>
                )}
                <div className="px-2">
                  <button
                    type="button"
                    onClick={() => {
                      const slug = (product as any).slug;
                      if (slug) {
                        setQuickSlug(slug);
                        try { window.history.pushState({ quickOpen: true }, ''); } catch {}
                      }
                    }}
                    aria-label={`Open quick view: ${product.name || (product as any).title}`}
                    className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-[#F7A81B] hover:bg-[#E3960A] text-[#262626] font-semibold py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A27D4C]"
                  >
                    Quick View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {quickSlug && (
        <QuickView
          product={(storefrontService.findBySlug(quickSlug) as any) || {
            id: '', title: '', slug: '', category: 'food', amazonUrl: '', image: '', imageAlt: '', noteShort: '', tags: [], isAlexisPick: false, showInFavorites: false, status: 'draft', sortWeight: 0, usedIn: [], pairsWith: [], createdAt: '', updatedAt: ''
          }}
          onClose={() => {
            setQuickSlug(null);
            try { if (window.history.state?.quickOpen) window.history.back(); } catch {}
          }}
        />
      )}
      </div>
    </main>
  );
};

export default CategoryPage;