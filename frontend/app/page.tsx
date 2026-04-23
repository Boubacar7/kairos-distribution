import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CategoryStrip from '@/components/CategoryStrip';
import { api, Product } from '@/lib/api';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-products';

async function getFeatured(): Promise<Product[]> {
  try {
    const items = await api.get<Product[]>('/products?status=PUBLISHED');
    if (items.length > 0) return items.slice(0, 4);
  } catch {
    // ignored — fall through to static fallback
  }
  return FALLBACK_PRODUCTS.slice(0, 4);
}

const REVIEWS = [
  { a: 'Safi C.', c: 'Dakar', t: 'Un vrai coup de cœur', r: 5, b: 'Livraison rapide, emballage soigné et les produits tiennent leurs promesses. La crème Glow Skin est devenue mon indispensable.' },
  { a: 'Fatou N.', c: 'Abidjan', t: 'Résultats visibles', r: 5, b: 'Après 3 semaines de Trim Active, je vois une vraie différence. Le suivi WhatsApp m’a aidée à tenir la routine.' },
  { a: 'Massara S.', c: 'Bamako', t: 'Bon rapport qualité/prix', r: 4, b: 'Le pack Lip & Glow est parfait pour découvrir la marque. Seul bémol : j’aurais aimé une version plus grande.' },
  { a: 'Awa C.', c: 'Cotonou', t: 'Service impeccable', r: 5, b: 'Équipe réactive, réponse sous 10 minutes en Snap. Je recommande les yeux fermés.' },
];

const COMMUNITY_PHOTOS = [
  '/community/1.jpg',
  '/community/2.jpg',
  '/community/3.jpg',
  '/community/4.jpg',
  '/community/1.jpg',
  '/community/2.jpg',
  '/community/3.jpg',
  '/community/4.jpg',
];

export default async function Home() {
  const featured = await getFeatured();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* ── Hero image banner (full-bleed, image entière visible) ── */}
        <section id="top" className="relative block w-full overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cover.jpg"
            alt="My body goal"
            className="block h-auto w-full"
          />

          {/* Dégradés de lisibilité */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-[38%]"
            style={{ background: 'linear-gradient(to bottom, rgba(20,10,10,0.7) 0%, transparent 100%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[32%]"
            style={{ background: 'linear-gradient(to top, rgba(20,10,10,0.7) 0%, transparent 100%)' }}
          />

          {/*
            Pile de 3 lignes, alignée avec le logo de la nav :
              - même padding gauche que la nav (16px mobile, 48px desktop)
              - première ligne centrée dans la barre nav (h=58 mobile, h=70 desktop)
              - lignes 2 et 3 dépassent sous la nav
          */}
          <div
            className="absolute left-0 right-0 top-0 z-[60] flex min-h-[58px] flex-col items-start gap-1.5 px-4 py-2.5 md:min-h-[70px] md:gap-2 md:px-12 md:py-3.5"
          >
            <span
              className="font-display text-white"
              style={{
                fontSize: 'clamp(22px,5vw,32px)',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                textShadow: '0 2px 16px rgba(0,0,0,.8)',
                whiteSpace: 'nowrap',
              }}
            >
              Mybodygoal
            </span>
            <span
              className="text-white"
              style={{
                fontSize: 'clamp(10px,1.6vw,12px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                textShadow: '0 1px 10px rgba(0,0,0,.8)',
                whiteSpace: 'nowrap',
              }}
            >
              By Kairos.Distribution
            </span>
            <span
              className="text-white/90"
              style={{
                fontSize: 'clamp(9px,1.4vw,11px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                textShadow: '0 1px 10px rgba(0,0,0,.8)',
                whiteSpace: 'nowrap',
              }}
            >
              Beauté · Silhouette · Confiance
            </span>
          </div>

          {/* CTAs en bas à gauche */}
          <div className="absolute bottom-0 left-0 right-0 z-[55] flex flex-wrap items-end gap-3 px-4 pb-6 md:px-12 md:pb-10">
            <Link
              href="#produits"
              className="rounded-pill bg-white px-5 py-3 text-[13px] font-bold text-bordeaux shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition hover:scale-105 md:px-7 md:py-3.5 md:text-sm"
            >
              Voir les produits →
            </Link>
            <Link
              href="#avis"
              className="rounded-pill border-[1.5px] border-white/50 bg-transparent px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-white/10 md:px-7 md:py-3.5 md:text-sm"
            >
              Avis clients
            </Link>
          </div>
        </section>

        {/* ── Category strip ── */}
        <CategoryStrip />

        {/* ── Products ── */}
        <section id="produits" className="container-app scroll-mt-20 py-14 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="kicker">Catalogue</span>
              <h2 className="font-display text-[clamp(26px,4.5vw,48px)] -tracking-[0.025em]">
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* ── Avis clients ── */}
        <section id="avis" className="scroll-mt-20 bg-cream-2 py-14 md:py-16">
          <div className="container-app">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="kicker">Avis clients</span>
                <h2 className="font-display text-[clamp(22px,3.5vw,40px)] -tracking-[0.02em]">
                  4.8/5 · avis vérifiés
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="text-bordeaux">★★★★★</span>
                <span>Moyenne générale</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:gap-5">
              {REVIEWS.map((r) => (
                <div key={r.a} className="card relative p-5 md:p-7">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-bordeaux text-sm">
                      {'★'.repeat(r.r)}
                      <span className="text-muted/40">{'★'.repeat(5 - r.r)}</span>
                    </span>
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

        {/* ── Retours clients (community photos) ── */}
        <section id="retours" className="container-app scroll-mt-20 py-14 md:py-20">
          <div className="mb-7 flex flex-col gap-1.5">
            <span className="kicker">Retours clients</span>
            <h2 className="font-display text-[clamp(22px,3.5vw,40px)] -tracking-[0.02em]">
              Photos partagées par la communauté
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {COMMUNITY_PHOTOS.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="aspect-square overflow-hidden rounded-md bg-rose-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Retour client ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
