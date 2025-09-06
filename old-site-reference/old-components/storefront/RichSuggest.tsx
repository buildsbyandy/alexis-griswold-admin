import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildAmazonUrl } from '../../lib/storefront';

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

interface RichSuggestProps {
  anchorEl: HTMLElement | null;
  results: StoreProduct[];
  query: string;
  onClose: () => void;
  onOpenQuick?: (slug: string, index: number) => boolean;
}

const RichSuggest: React.FC<RichSuggestProps> = ({ anchorEl, results, query, onClose, onOpenQuick }) => {
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Close on escape and on outside click
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const itemCount = visible.length + (showSeeAll ? 1 : 0);
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % itemCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + itemCount) % itemCount);
      } else if (e.key === 'Enter') {
        if (highlight < visible.length) openItem(visible[highlight], highlight);
        else if (showSeeAll) {
          const url = `/storefront/search?q=${encodeURIComponent(query)}`;
          window.location.assign(url);
          onClose();
        }
      }
    };
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!containerRef.current || containerRef.current.contains(t)) return;
      if (anchorEl && anchorEl.contains(t)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [anchorEl, onClose]);

  // Track anchor position/size so the popover can align initially and on resizes
  useEffect(() => {
    const update = () => {
      if (!anchorEl) {
        setRect(null);
        return;
      }
      const r = anchorEl.getBoundingClientRect();
      setRect(r);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [anchorEl]);

  // Cap to max 6 items for display; compute whether to show the CTA row
  const visible = useMemo(() => results.slice(0, 6), [results]);
  const showSeeAll = results.length > 6;

  const openItem = (item: StoreProduct, index: number) => {
    const slug = (item as any).slug as string | undefined;
    if (slug && onOpenQuick && onOpenQuick(slug, index)) {
      onClose();
      return;
    }
    const href = buildAmazonUrl(item.link || item.url || '', { subtag: `search-suggest-${index}` });
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
    try {
      (window as any)?.analytics?.track?.('search_suggest_click', { q: query, item_id: item.id });
    } catch {}
    onClose();
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const itemCount = visible.length + (showSeeAll ? 1 : 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % itemCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + itemCount) % itemCount);
    } else if (e.key === 'Enter') {
      if (highlight < visible.length) {
        openItem(visible[highlight], highlight);
      } else if (showSeeAll) {
        const url = `/storefront/search?q=${encodeURIComponent(query)}`;
        window.location.assign(url);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!anchorEl || !rect) return null;

  // Position relative to the document so it scrolls away naturally with the page
  const style: React.CSSProperties = {
    position: 'absolute',
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
    width: rect.width,
    zIndex: 50,
  };

  return createPortal(
    <div
      ref={containerRef}
      style={style}
      role="listbox"
      aria-label="Search suggestions"
      className="rounded-lg border border-[#E6E6E6] bg-white shadow-lg overflow-hidden"
      onKeyDown={onKeyDown}
    >
      {visible.map((p, idx) => {
        const active = idx === highlight;
        const title = p.title || p.name || '';
        const price = p.priceText || p.price;
        return (
          <div
            key={p.id}
            role="option"
            aria-selected={active}
            className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#F7F4EF] cursor-pointer ${
              active ? 'bg-[#F7F4EF]' : ''
            }`}
            onMouseEnter={() => setHighlight(idx)}
            onMouseDown={(e) => {
              e.preventDefault();
              openItem(p, idx);
            }}
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded">
              <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[#262626]">{title}</div>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                {p.category && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E3D4C2] text-[#383B26] truncate max-w-[10rem]">
                    {p.category}
                  </span>
                )}
                {price && <span className="text-[#6B6B6B]">{price}</span>}
              </div>
            </div>
          </div>
        );
      })}

      {showSeeAll && (
        <a
          role="option"
          aria-selected={highlight === visible.length}
          className={`block px-3 py-2 text-sm hover:bg-[#F7F4EF] cursor-pointer border-t border-[#E6E6E6] ${
            highlight === visible.length ? 'bg-[#F7F4EF]' : ''
          }`}
          href={`/storefront/search?q=${encodeURIComponent(query)}`}
          onMouseEnter={() => setHighlight(visible.length)}
          onMouseDown={(e) => {
            e.preventDefault();
            window.location.assign(`/storefront/search?q=${encodeURIComponent(query)}`);
            onClose();
          }}
        >
          See all results →
        </a>
      )}
    </div>,
    document.body
  );
};

export default RichSuggest;


