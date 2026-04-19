import ProductCard from '@/components/ProductCard';
import { api, Product } from '@/lib/api';

async function getProducts(): Promise<Product[]> {
  try {
    return await api.get<Product[]>('/products?status=ACTIVE');
  } catch {
    return [];
  }
}

export default async function ProduitsPage() {
  const products = await getProducts();
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">Boutique</h1>
      <p className="mt-1 text-sm text-muted">
        {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
      </p>
      {products.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Aucun produit pour le moment.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
