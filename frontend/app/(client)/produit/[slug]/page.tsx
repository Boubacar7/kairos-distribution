import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, Product, Review } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

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

      <ProductDetailClient product={product} reviews={reviews} />
    </section>
  );
}
