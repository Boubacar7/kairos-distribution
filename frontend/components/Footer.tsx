import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-10 bg-bordeaux-dark pt-16 pb-8 text-rose-50">
      <div className="container-app">
        <div className="mb-10 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display text-[26px] text-white">My body goal</div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-rose-200">By Kairos.Distribution</div>
            <p className="max-w-[280px] text-[13px] leading-relaxed text-rose-100">
              Beauté, silhouette et confiance. Expédition partout dans le monde.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="kicker text-rose-200">Boutique</span>
            <Link href="/produits" className="text-[13px] text-rose-100 hover:text-white">Produits</Link>
            <Link href="/produits?filter=promo" className="text-[13px] text-rose-100 hover:text-white">Promos</Link>
            <Link href="/produits?filter=coffrets" className="text-[13px] text-rose-100 hover:text-white">Coffrets</Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="kicker text-rose-200">Service</span>
            <Link href="/support" className="text-[13px] text-rose-100 hover:text-white">WhatsApp / Snap</Link>
            <Link href="/compte" className="text-[13px] text-rose-100 hover:text-white">Suivi commande</Link>
            <Link href="/support" className="text-[13px] text-rose-100 hover:text-white">Retours</Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="kicker text-rose-200">Livraison</span>
            <span className="text-[13px] text-rose-100">Partout dans le monde</span>
            <span className="text-[13px] text-rose-100">Expédition en 24-72h</span>
            <span className="text-[13px] text-rose-100">Wave · Moov · CB</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bordeaux/30 pt-5 text-[11px] text-rose-100">
          <span>© {new Date().getFullYear()} My body goal By Kairos.Distribution</span>
          <span>Tous droits réservés</span>
        </div>
      </div>
    </footer>
  );
}
