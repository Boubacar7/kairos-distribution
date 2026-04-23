'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cartCount, readCart } from '@/lib/cart';
import { Currency } from '@/lib/api';

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/produits', label: 'Produits' },
  { href: '/compte', label: 'Avis' },
  { href: '/support', label: 'Support' },
];
const CURRENCIES: Currency[] = ['FCFA', 'EUR', 'USD'];

export default function Navbar() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [currency, setCurrency] = useState<Currency>('FCFA');

  const onHome = pathname === '/';

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

  useEffect(() => {
    if (!onHome) {
      setOpaque(true);
      return;
    }
    const h = () => setOpaque(window.scrollY > 60);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [onHome]);

  useEffect(() => {
    try {
      const v = localStorage.getItem('kairos_currency') as Currency | null;
      if (v === 'FCFA' || v === 'EUR' || v === 'USD') setCurrency(v);
    } catch {}
  }, []);

  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('kairos_currency', c);
    window.dispatchEvent(new CustomEvent('kairos:currency'));
  };

  const navCls = opaque
    ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(26,20,20,0.08)]'
    : 'bg-transparent';

  // When the hero is visible (home + transparent state), hide the left brand
  // block since the hero image has a baked-in top-left title.
  const brandVisible = !(onHome && !opaque);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-[background,box-shadow] duration-300 ${navCls}`}>
      <div className="flex h-[58px] items-center justify-between px-4 md:h-[70px] md:px-12">
        <Link
          href="/"
          className={`flex flex-col items-start leading-tight transition-opacity ${
            brandVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!brandVisible}
        >
          <span className={`font-display text-xl font-medium -tracking-[0.01em] ${opaque ? 'text-ink' : 'text-white'}`}>
            My body goal
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${opaque ? 'text-ink-2/70' : 'text-white/75'}`}>
            By Kairos.Distribution
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            const base = 'rounded-pill px-4 py-2 text-[13px] font-medium transition-colors';
            const colors = opaque
              ? active
                ? 'bg-bordeaux text-white'
                : 'text-ink-2 hover:bg-rose-50 hover:text-bordeaux'
              : active
                ? 'bg-white/25 text-white'
                : 'text-white/90 hover:bg-white/20 hover:text-white';
            return (
              <Link key={l.href} href={l.href} className={`${base} ${colors}`}>
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className={`hidden rounded-pill p-[3px] backdrop-blur-sm sm:flex ${
              opaque ? 'bg-cream-2' : 'bg-white/15'
            }`}
          >
            {CURRENCIES.map((c) => {
              const on = currency === c;
              const base = 'rounded-pill px-2.5 py-1 text-[10px] font-bold transition-colors';
              const colors = on
                ? opaque
                  ? 'bg-bordeaux text-white'
                  : 'bg-white text-bordeaux'
                : opaque
                  ? 'text-ink-2 hover:text-bordeaux'
                  : 'text-white hover:text-white';
              return (
                <button key={c} onClick={() => pickCurrency(c)} className={`${base} ${colors}`}>
                  {c}
                </button>
              );
            })}
          </div>

          <Link
            href="/panier"
            className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-[13px] font-semibold transition-colors ${
              opaque
                ? 'border-bordeaux bg-bordeaux text-white hover:bg-bordeaux-dark'
                : 'border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.5 12h11L21 7H6" />
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
            </svg>
            Panier
            {count > 0 && (
              <span
                className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold ${
                  opaque ? 'bg-rose-100 text-bordeaux' : 'bg-white text-bordeaux'
                }`}
              >
                {count}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
            className={`flex items-center justify-center rounded-md border p-2 backdrop-blur-sm lg:hidden ${
              opaque ? 'border-line-strong bg-cream-2 text-ink' : 'border-white/30 bg-white/20 text-white'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {mobile && (
        <div className="border-t border-line-soft bg-white px-4 py-2 lg:hidden">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobile(false)}
                className={`block border-b border-line-soft py-3 text-[15px] last:border-0 ${active ? 'font-semibold text-bordeaux' : 'text-ink'}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
