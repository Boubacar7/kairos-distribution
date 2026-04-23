'use client';

import { formatPrice, Product, Review } from '@/lib/api';
import { useCurrency } from '@/lib/useCurrency';
import AddToCartButton from './AddToCartButton';

function gradientFor(slug: string): 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return ((sum % 3) + 1) as 1 | 2 | 3;
}

export default function ProductDetailClient({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const currency = useCurrency();
  const g = gradientFor(product.slug);
  const discounted = product.promo > 0 && product.promo > product.price;

  return (
    <>
      <div className="grid gap-10 md:grid-cols-2">
        {product.image ? (
          <div
            className="ph square"
            style={{ backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ) : (
          <div className={`ph square g${g}`}>
            <span className="ph-lbl">{product.name}</span>
          </div>
        )}

        <div>
          {product.category && <span className="chip mb-3">{product.category}</span>}
          <h1 className="font-display text-[clamp(32px,4.5vw,48px)] leading-none -tracking-[0.03em]">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-bordeaux">
              {formatPrice(product.price, currency)}
            </span>
            {discounted ? (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.promo, currency)}
              </span>
            ) : null}
          </div>

          {product.description && (
            <p className="mt-5 text-[14px] leading-relaxed text-ink-2">{product.description}</p>
          )}

          <div className="mt-2 text-xs text-muted">
            {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
          </div>

          <div className="mt-7">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <span className="kicker">Communauté</span>
        <h2 className="mt-2 font-display text-[clamp(24px,3.5vw,36px)] -tracking-[0.02em]">
          Avis clients
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun avis pour le moment.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card p-7">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-bordeaux">
                    {'★'.repeat(r.rating)}
                    <span className="text-muted/40">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-[11px] text-muted">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-2">« {r.comment} »</p>
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="avis" className="mt-3 h-32 rounded-sm object-cover" />
                ) : null}
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-bordeaux">
                    {r.author[0]}
                  </div>
                  <div className="text-[13px] font-medium">{r.author}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
