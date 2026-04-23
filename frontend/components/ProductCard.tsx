'use client';

import Link from 'next/link';
import { formatPrice, Product } from '@/lib/api';
import { useCurrency } from '@/lib/useCurrency';

function gradientFor(slug: string): 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return ((sum % 3) + 1) as 1 | 2 | 3;
}

export default function ProductCard({ product }: { product: Product }) {
  const currency = useCurrency();
  const g = gradientFor(product.slug);
  const discounted = product.promo > 0 && product.promo > product.price;

  return (
    <Link href={`/produit/${product.slug}`} className="product-card group flex flex-col">
      {product.image ? (
        <div
          className="ph tall mb-3.5"
          style={{ backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ) : (
        <div className={`ph tall g${g} mb-3.5`}>
          <span className="ph-lbl">{product.name}</span>
        </div>
      )}

      <div className="flex flex-col px-1 pb-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="chip text-[11px]">{product.category}</span>
          {discounted ? <span className="chip chip-promo text-[10px]">PROMO</span> : null}
        </div>

        <div className="font-display text-lg leading-tight -tracking-[0.01em]">{product.name}</div>
        {product.description ? (
          <p className="mt-1 min-h-[28px] text-xs leading-[1.4] text-muted line-clamp-2">
            {product.description}
          </p>
        ) : (
          <div className="min-h-[28px]" />
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">{formatPrice(product.price, currency)}</span>
            {discounted ? (
              <span className="text-[11px] text-muted line-through">
                {formatPrice(product.promo, currency)}
              </span>
            ) : null}
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white transition group-hover:bg-bordeaux">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
