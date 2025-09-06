import React, { useEffect, useMemo, useState } from 'react';
import FeaturedProductsCarousel from '../components/FeaturedProductsCarousel';
import ArcDivider from '../components/ArcDivider';
import ModalCard from '../components/ModalCard';
import CompactSearch from '../components/CompactSearch';
import { Link } from 'react-router-dom';
import { searchProducts, buildAmazonUrl } from '../lib/storefront';
import ChipNav from '../components/storefront/ChipNav';
import QuickView from '../components/storefront/QuickView';
import { SupabaseStorefrontService } from '../lib/database/supabaseService';
import type { StorefrontProduct, StorefrontCategory } from '../types/supabase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const Storefront: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [categories, setCategories] = useState<Array<StorefrontCategory>>([]);
  const [products, setProducts] = useState<Array<StorefrontProduct>>([]);
  const [favorites, setFavorites] = useState<Array<StorefrontProduct>>([]);
  const [q, setQ] = useState('');
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  
  // Define the type for the search product format
  type SearchProduct = {
    id: string;
    name: string;
    image: string;
    price: string;
    tagline?: string;
    featured?: boolean;
    category: 'food' | 'healing' | 'home' | 'personal-care';
    tags?: string[];
    link: string;
  };

  // Define the type for the product display format
  type DisplayProduct = {
    id: string;
    title: string;
    slug: string;
    amazonUrl: string;
    imageUrl: string;
    imageAlt: string;
    description: string;
    price: string;
    category: 'food' | 'healing' | 'home' | 'personal-care';
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
  };

  const results = useMemo(() => {
    // Convert StorefrontProduct to the format expected by searchProducts
    const searchableProducts: SearchProduct[] = products.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image_url,
      price: p.price,
      tagline: p.description,
      featured: p.is_favorite,
      category: p.category_id as 'food' | 'healing' | 'home' | 'personal-care',
      tags: p.tags,
      link: p.amazon_url
    }));
    return searchProducts(searchableProducts, q);
  }, [products, q]);
  const quickItem = useMemo(() => products.find(p => p.slug === quickSlug), [products, quickSlug]);
  const totalCount = products.length;

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load categories and products in parallel
        const [categoriesData, productsData, favoritesData] = await Promise.all([
          new SupabaseStorefrontService().getCategories(),
          new SupabaseStorefrontService().getStorefrontProducts(),
          new SupabaseStorefrontService().getFavoriteProducts()
        ]);

        setCategories(categoriesData as unknown as Array<StorefrontCategory>);
        setProducts(productsData as unknown as Array<StorefrontProduct>);
        setFavorites(favoritesData as unknown as Array<StorefrontProduct>);
      } catch (err) {
        console.error('Error loading storefront data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load storefront data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Deep link handler: ?quick=slug
  useEffect(() => {
    const u = new URL(window.location.href);
    const s = u.searchParams.get('quick');
    if (s) setQuickSlug(s);
    const onOpen = (e: any) => setQuickSlug(e?.detail?.slug || null);
    window.addEventListener('storefront:openQuick', onOpen as any);
    return () => window.removeEventListener('storefront:openQuick', onOpen as any);
  }, []);

  if (loading) {
    return (
      <div className="theme-storefront w-full min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-storefront w-full min-h-screen flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!products.length || !categories.length) {
    return (
      <div className="theme-storefront w-full min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Products Available</h2>
          <p className="text-gray-600 mb-4">Check back soon for our curated collection of products!</p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                try {
                  await new SupabaseStorefrontService().seedData();
                  window.location.reload();
                } catch (err) {
                  console.error('Error seeding data:', err);
                  alert('Failed to seed data. Check console for details.');
                }
              }}
              className="px-4 py-2 bg-[#B89178] text-white rounded-lg hover:bg-[#A67B62] transition-colors"
            >
              Seed Development Data
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="theme-storefront w-full text-[var(--body)] font-serif flex flex-col items-center">
      <div className="font-brand-body w-full">
      {/* HERO / My Favorites (white) — hairline directly under global header */}
      <section className="w-full bg-[var(--band-hero)] text-[var(--body)] border-t border-[var(--hairline)]">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 pb-4 md:pb-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-wide sm:text-3xl lg:text-4xl xl:text-5xl text-[var(--heading)]">Alexis’ Storefront</h1>
            <p className="hidden md:block text-sm sm:text-base text-[var(--muted)]">Curated by Alexis · Updated weekly · Affiliate disclosure</p>
            <div className="md:hidden text-[13px] text-[var(--muted)]">
              <p>Curated by Alexis · Updated weekly · Affiliate disclosure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Favorites carousel */}
      <section className="w-full bg-[#f8f3ec] favorites-section">
        <img
          src="/section_dividers/arc-divider-white.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-auto block"
        />
        <div className="max-w-6xl mx-auto px-4 pt-2 md:pt-0 -mt-6 md:-mt-28 lg:-mt-32 pb-2 md:pb-1">
          <h2 className="mb-4 font-serif text-2xl md:text-3xl text-[var(--heading)] text-center">My Favorites</h2>
          <FeaturedProductsCarousel 
            products={favorites.map((p): SearchProduct => ({
              id: p.id,
              name: p.name,
              image: p.image_url,
              price: p.price,
              tagline: p.description,
              featured: p.is_favorite,
              category: p.category_id as 'food' | 'healing' | 'home' | 'personal-care',
              tags: p.tags,
              link: p.amazon_url
            }))} 
            title="" 
          />
        </div>
        <ArcDivider flip className="w-full h-auto -mt-18 md:-mt-26 lg:-mt-32" />
      </section>

      {/* CATEGORIES band (cream) */}
      <section className="w-full bg-[#F8F3EC]">
        <div className="w-full h-2 bg-white" aria-hidden="true"></div>
        <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-10 pb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-[#111] text-center">Shop by Category</h2>
          <div className="mt-2 md:mt-3 flex justify-center">
            <p className="text-[var(--muted,#6B6B6B)] text-center">Explore {categories.length} categories · {totalCount} picks</p>
          </div>

          {/* Mobile category chips (sticky, black variant) */}
          <ChipNav />

          <div className="mt-6 hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map(category => {
              const count = products.filter(p => p.category_id === category.id).length;
              return (
                <Link
                  to={`/storefront/${category.id}`}
                  key={category.id}
                  className="group relative block h-48 md:h-56 rounded-xl overflow-hidden ring-1 ring-[var(--hairline,#EADFD2)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A27D4C]"
                  aria-label={`View category: ${category.name}`}
                >
                  <div className="absolute inset-0">
                    <img src={category.image_url} alt={category.name} className="object-cover w-full h-full" loading="lazy" />
                  </div>
                  <div className="absolute inset-0 transition-all bg-gradient-to-t from-black/50 via-black/25 to-transparent group-hover:from-black/70 group-hover:via-black/40" />
                  <div className="absolute text-white left-4 bottom-4 right-4">
                    <div className="text-xl font-semibold line-clamp-2">{category.name}</div>
                    <div className="text-sm opacity-90 line-clamp-1">{category.description}{count ? ` · ${count} picks` : ''}</div>
                    <div className="text-xs mt-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition">Shop →</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Tools card: Search + CTA */}
          <div className="mt-8 rounded-2xl bg-white border border-[var(--hairline,#EADFD2)] shadow-sm px-4 py-4 md:flex md:items-center md:gap-3">
            <div className="relative md:flex-1">
              <CompactSearch products={products as any} />
            </div>
            <a
              href="https://www.amazon.com/shop/lexigriswold"
              target="_blank"
              rel="nofollow sponsored noopener"
              className="mt-3 md:mt-0 md:ml-auto inline-flex items-center justify-center rounded-md bg-amazon-orange hover:bg-amazon-orangeDark text-[#262626] font-semibold px-5 py-2.5"
            >
              <img src="/shopping-cart.svg" alt="" className="mr-2 h-4 w-4" aria-hidden="true" />
              Shop my Amazon Storefront
            </a>
          </div>
        </div>
      </section>

      {quickItem && (
        <QuickView
          product={quickItem}
          onClose={() => {
            setQuickSlug(null);
            try { if (window.history.state?.quickOpen) window.history.back(); } catch {}
          }}
        />
      )}

      </div>
    </div>
  );
};

export default Storefront; 