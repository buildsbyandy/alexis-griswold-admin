import React, { useEffect, useMemo, useRef } from 'react';
import type { StorefrontProduct } from '../../lib/supabase/storefrontService';

function useMediaQuery(query: string) {
	const [matches, setMatches] = React.useState<boolean>(() => {
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

export interface QuickViewProps {
	product: StorefrontProduct;
	onClose: () => void;
	onAmazonClick?: (p: StorefrontProduct) => void;
	onUsedInClick?: (p: StorefrontProduct, item: { type: 'recipe' | 'video'; slug: string }) => void;
	onPairsWithClick?: (p: StorefrontProduct, slug: string) => void;
}

const QuickView: React.FC<QuickViewProps> = ({ product, onClose, onAmazonClick, onUsedInClick, onPairsWithClick }) => {
	const isMobile = useMediaQuery('(max-width: 767px)');
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
	const lastActive = useRef<HTMLElement | null>(null);

	useEffect(() => {
		lastActive.current = (document.activeElement as HTMLElement) || null;
		// lock body scroll
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		// focus management
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'Tab') {
				// simple focus trap
				const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				if (!focusables || focusables.length === 0) return;
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					(last as HTMLElement).focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					(first as HTMLElement).focus();
				}
			}
		};
		document.addEventListener('keydown', onKey);
		// initial focus
		setTimeout(() => firstFocusableRef.current?.focus(), 0);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
			if (lastActive.current) {
				try { lastActive.current.focus(); } catch {}
			}
		};
	}, [onClose]);

	useEffect(() => {
		try { (window as any)?.analytics?.track?.('sf_quick_view_open', { slug: product.slug }); } catch {}
	}, [product.slug]);

	const usedInList = useMemo(() => (product.usedIn || []).slice(0, 3), [product.usedIn]);
	const pairsWithList = useMemo(() => (product.pairsWith || []).slice(0, 3), [product.pairsWith]);

	const container = (
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label={`${product.title} quick view`}
			className={`bg-white rounded-t-2xl md:rounded-xl shadow-lg w-full md:max-w-2xl md:mx-auto ${isMobile ? 'fixed inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto' : 'p-0'}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-[var(--hairline,#E6E6E6)]">
				<div className="flex items-center gap-2">
					<span className="px-2 py-0.5 rounded-full bg-[#E3D4C2] text-[#383B26] text-xs">{product.category}</span>
					{product.isAlexisPick && (
						<span className="px-2 py-0.5 rounded-full bg-[var(--chip-bg,#EDE3D6)] text-[var(--chip-fg,#383B26)] text-xs">Alexis’ Pick</span>
					)}
				</div>
				<button
					ref={firstFocusableRef}
					onClick={onClose}
					className="h-9 px-3 rounded-md border border-[var(--hairline,#E6E6E6)] text-[#262626] bg-white"
					aria-label="Close quick view"
				>
					Close
				</button>
			</div>
			{/* Body */}
			<div className="p-4">
				<div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#F7F4EF]">
					<img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
				</div>
				<h2 className="mt-3 font-serif text-xl text-[#262626]">{product.name}</h2>
				{product.description && (
					<p className="mt-1 text-sm text-[#654C37] line-clamp-4">{product.description}</p>
				)}
				<div className="mt-4 space-y-2">
					<a
						href={product.amazon_url}
						target="_blank"
						rel="nofollow sponsored noopener"
						className="w-full inline-flex items-center justify-center rounded-md bg-[#F7A81B] hover:bg-[#E3960A] text-[#262626] font-semibold h-11 text-sm"
						onClick={(e) => {
							try { (window as any)?.analytics?.track?.('sf_quick_view_amazon_click', { slug: product.slug }); } catch {}
							onAmazonClick?.(product);
						}}
					>
						View on Amazon →
					</a>
					<p className="text-[12px] text-[#6B6B6B]">As an Amazon Associate, Alexis may earn from qualifying purchases.</p>
				</div>

				{/* Used in and Pairs with sections removed until we have the data in Supabase */}

				<div className="mt-4">
					<a href={`/storefront/p/${product.slug}`} className="text-sm font-medium underline text-[#262626]"
						onClick={() => { try { (window as any)?.analytics?.track?.('sf_quick_view_more_details_click', { slug: product.slug }); } catch {} }}
					>
						More details & related →
					</a>
				</div>
			</div>
		</div>
	);

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
			<div className={`absolute inset-x-0 ${isMobile ? 'bottom-0' : 'top-1/2 -translate-y-1/2 flex justify-center px-4'}`}>
				{container}
			</div>
		</div>
	);
};

export default QuickView;


