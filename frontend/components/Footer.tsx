import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="font-serif text-xl text-primary">Kairos Distributions</div>
          <p className="mt-2 text-sm text-muted">
            Produits de beauté et minceur sélectionnés avec soin. Livraison en Afrique de l&apos;Ouest.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Navigation</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/produits" className="hover:text-primary">Boutique</Link></li>
            <li><Link href="/compte" className="hover:text-primary">Mon compte</Link></li>
            <li><Link href="/support" className="hover:text-primary">Support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Contact</h4>
          <p className="text-sm text-muted">support@kairos.example</p>
          <p className="text-sm text-muted">+225 00 00 00 00</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Kairos Distributions. Tous droits réservés.
      </div>
    </footer>
  );
}
