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

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  const reviews = await getReviews(product.id);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl2 bg-soft">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Pas d&apos;image
            </div>
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl">{product.name}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-primary">
              {formatPrice(product.priceCents, product.currency)}
            </span>
            {product.compareAtCents ? (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.compareAtCents, product.currency)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-muted">{product.description}</p>
          <div className="mt-2 text-xs text-muted">
            {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
          </div>
          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl">Avis clients</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun avis pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.author}</span>
                  <span className="text-primary">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="mt-2 text-sm">{r.comment}</p>
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="avis" className="mt-2 h-32 rounded-xl object-cover" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
