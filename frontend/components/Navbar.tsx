'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cartCount, readCart } from '@/lib/cart';

export default function Navbar() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setCount(cartCount(readCart()));
    refresh();
    window.addEventListener('kairos:cart', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('kairos:cart', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const links = [
    { href: '/produits', label: 'Boutique' },
    { href: '/compte', label: 'Mon compte' },
    { href: '/support', label: 'Support' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-serif text-2xl text-primary">
          Kairos
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/panier" className="btn btn-outline text-sm">
            Panier{count > 0 ? ` (${count})` : ''}
          </Link>
          <button
            className="btn btn-outline md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
