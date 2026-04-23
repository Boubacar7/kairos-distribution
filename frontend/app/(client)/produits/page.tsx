import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { api, Product } from '@/lib/api';

const CATS = [
  { id: 'all', label: 'Tous' },
  { id: 'Beauté', label: 'Beauté' },
  { id: 'Amincissant', label: 'Silhouette' },
  { id: 'Postérieur', label: 'Tonification' },
  { id: 'Promo', label: 'Promos' },
];

async function getProducts(): Promise<Product[]> {
  try {
    return await api.get<Product[]>('/products?status=PUBLISHED');
  } catch {
    return [];
  }
}

export default async function ProduitsPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const activeCat = searchParams.cat || 'all';
  const products = await getProducts();
  const filtered =
    activeCat === 'all'
      ? products
      : products.filter((p) => p.category === activeCat);

  return (
    <section className="container-app screen-enter pt-[90px] pb-20">
      <div className="mb-3 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-bordeaux">Accueil</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span>Catalogue</span>
      </div>

      <h1 className="font-display text-[clamp(32px,5.5vw,56px)] leading-none -tracking-[0.03em]">
        Catalogue
      </h1>
      <p className="mt-3 mb-7 text-sm text-muted">
        {filtered.length} produit{filtered.length > 1 ? 's' : ''} · livraison 24-72h · paiement à la livraison possible
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATS.map((c) => {
          const href = c.id === 'all' ? '/produits' : `/produits?cat=${encodeURIComponent(c.id)}`;
          const on = activeCat === c.id;
          return (
            <Link
              key={c.id}
              href={href}
              className={`rounded-pill border px-4 py-2 text-xs font-medium transition ${
                on
                  ? 'border-bordeaux bg-bordeaux text-white'
                  : 'border-line-strong bg-transparent text-ink-2 hover:border-bordeaux hover:text-bordeaux'
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-line-soft bg-cream py-12 text-center text-sm text-muted">
          Aucun produit pour cette sélection.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
