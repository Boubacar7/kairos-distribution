import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CategoryStrip from '@/components/CategoryStrip';
import { api, Product } from '@/lib/api';

async function getFeatured(): Promise<Product[]> {
  try {
    const items = await api.get<Product[]>('/products?status=PUBLISHED');
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
        {/* ── Full-bleed image hero ── */}
        <section className="relative block w-full overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cover.jpg"
            alt="My body goal"
            className="block h-auto w-full"
          />

          {/* Top gradient overlay for nav legibility */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-[45%]"
            style={{ background: 'linear-gradient(to bottom, rgba(20,10,10,0.65) 0%, transparent 100%)' }}
          />
          {/* Bottom gradient overlay for CTAs */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[40%]"
            style={{ background: 'linear-gradient(to top, rgba(20,10,10,0.65) 0%, transparent 100%)' }}
          />

          {/* Top-left stacked title */}
          <div className="absolute left-0 top-0 z-20 flex flex-col gap-3.5 px-4 py-3.5 md:px-12 md:py-[14px]">
            <span
              className="font-display text-white"
              style={{ fontSize: 'clamp(24px,4vw,32px)', lineHeight: 1.05, textShadow: '0 2px 16px rgba(0,0,0,.8)' }}
            >
              Mybodygoal
            </span>
            <span
              className="text-white"
              style={{
                fontSize: 'clamp(10px,1.2vw,12px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                textShadow: '0 1px 10px rgba(0,0,0,.8)',
              }}
            >
              By Kairos.Distribution
            </span>
            <span
              className="text-white/90"
              style={{
                fontSize: 'clamp(10px,1.1vw,11px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                textShadow: '0 1px 10px rgba(0,0,0,.8)',
              }}
            >
              Beauté · Silhouette · Confiance
            </span>
          </div>

          {/* Bottom-left CTAs */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-wrap items-end gap-3 px-4 pb-7 md:px-12 md:pb-10">
            <Link
              href="/produits"
              className="rounded-pill bg-white px-7 py-3.5 text-sm font-bold text-bordeaux shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition hover:scale-105"
            >
              Voir les produits →
            </Link>
            <Link
              href="/compte"
              className="rounded-pill border-[1.5px] border-white/50 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Avis clients
            </Link>
          </div>
        </section>

        {/* ── Category strip ── */}
        <CategoryStrip />

        {/* ── Catalogue preview ── */}
        <section className="container-app py-16 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="kicker">Catalogue</span>
              <h2 className="font-display text-[clamp(28px,4.5vw,48px)] -tracking-[0.025em]">
                Nos rituels du moment
              </h2>
            </div>
            <Link href="/produits" className="btn btn-outline btn-sm">
              Tout voir
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-lg border border-line-soft bg-cream py-12 text-center text-sm text-muted">
              Catalogue bientôt disponible.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── Avis ── */}
        <section className="bg-cream-2 py-14">
          <div className="container-app">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="kicker">Avis clients</span>
                <h2 className="font-display text-[clamp(24px,3.5vw,40px)] -tracking-[0.02em]">
                  4.8/5 · avis vérifiés
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="text-bordeaux">★★★★★</span>
                <span>Moyenne générale</span>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { a: 'Safi C.', c: 'Dakar', t: 'Un vrai coup de cœur', b: 'Livraison rapide, emballage soigné et les produits tiennent leurs promesses. La crème Glow Skin est devenue mon indispensable.' },
                { a: 'Fatou N.', c: 'Abidjan', t: 'Résultats visibles', b: 'Après 3 semaines de Trim Active, je vois une vraie différence. Le suivi WhatsApp m’a aidée à tenir la routine.' },
              ].map((r) => (
                <div key={r.a} className="card relative p-7">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-bordeaux text-sm">★★★★★</span>
                  </div>
                  <div className="font-display text-lg -tracking-[0.01em]">{r.t}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">« {r.b} »</p>
                  <div className="mt-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-bordeaux">
                      {r.a[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium">{r.a}</span>
                      <span className="text-[11px] text-muted">{r.c} · Vérifié</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
