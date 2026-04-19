import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { api, Product } from '@/lib/api';

async function getFeatured(): Promise<Product[]> {
  try {
    const items = await api.get<Product[]>('/products?status=ACTIVE');
    return items.slice(0, 4);
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeatured();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
            <div>
              <h1 className="font-serif text-4xl text-primary md:text-5xl">
                Beauté & minceur, livrées chez vous
              </h1>
              <p className="mt-4 text-muted">
                Découvrez notre sélection de produits authentiques pour votre bien-être et votre routine beauté.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/produits" className="btn btn-primary">Voir la boutique</Link>
                <Link href="/support" className="btn btn-outline">Nous contacter</Link>
              </div>
            </div>
            <div className="aspect-square rounded-xl2 bg-primary/10" />
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-2xl">Produits populaires</h2>
            <Link href="/produits" className="text-sm text-primary">Tout voir →</Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-sm text-muted">Catalogue bientôt disponible.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
