import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, formatPrice, Product, Review } from '@/lib/api';
import AddToCartButton from './AddToCartButton';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await api.get<Product>(`/products/slug/${slug}`);
  } catch {
    return null;
  }
}

async function getReviews(productId: string): Promise<Review[]> {
  try {
    return await api.get<Review[]>(`/reviews?productId=${productId}&status=APPROVED`);
  } catch {
    return [];
  }
}

function gradientFor(slug: string): 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return ((sum % 3) + 1) as 1 | 2 | 3;
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  const reviews = await getReviews(product.id);
  const g = gradientFor(product.slug);
  const category = product.tags?.[0];

  return (
    <section className="container-app screen-enter pt-[90px] pb-16">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-bordeaux">Accueil</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <Link href="/produits" className="hover:text-bordeaux">Catalogue</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span>{product.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {product.imageUrl ? (
          <div
            className="ph square"
            style={{ backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ) : (
          <div className={`ph square g${g}`}>
            <span className="ph-lbl">{product.name}</span>
          </div>
        )}

        <div>
          {category && <span className="chip mb-3">{category}</span>}
          <h1 className="font-display text-[clamp(32px,4.5vw,48px)] leading-none -tracking-[0.03em]">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-bordeaux">
              {formatPrice(product.priceCents, product.currency)}
            </span>
            {product.compareAtCents ? (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.compareAtCents, product.currency)}
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
    </section>
  );
}
