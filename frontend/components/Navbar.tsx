'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cartCount, readCart } from '@/lib/cart';
import { Currency } from '@/lib/api';

type NavItem = { href: string; label: string; anchor?: string };

const LINKS: NavItem[] = [
  { href: '/', label: 'Accueil', anchor: 'top' },
  { href: '/#produits', label: 'Produits', anchor: 'produits' },
  { href: '/#avis', label: 'Avis clients', anchor: 'avis' },
  { href: '/#retours', label: 'Retours clients', anchor: 'retours' },
];

const CURRENCIES: Currency[] = ['FCFA', 'EUR', 'USD', 'CAD'];

export default function Navbar() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [currency, setCurrency] = useState<Currency>('FCFA');
  const [activeAnchor, setActiveAnchor] = useState<string>('top');

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

  // Scroll-spy: highlight the nav link matching the section currently in view.
  useEffect(() => {
    if (!onHome) return;
    const ids = ['top', 'produits', 'avis', 'retours'];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveAnchor(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onHome, pathname]);

  useEffect(() => {
    try {
      const v = localStorage.getItem('kairos_currency') as Currency | null;
      if (v === 'FCFA' || v === 'EUR' || v === 'USD' || v === 'CAD') setCurrency(v);
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

  // Hide the brand block only when the hero is visible (home + transparent).
  const brandVisible = !(onHome && !opaque);

  function linkIsActive(l: NavItem): boolean {
    if (onHome) {
      if (l.anchor === 'top' && activeAnchor === 'top') return true;
      if (l.anchor && l.anchor !== 'top' && activeAnchor === l.anchor) return true;
      return false;
    }
    // Off home: regular pathname matching
    const target = l.href.split('#')[0];
    if (target === '/' && pathname !== '/') return false;
    return pathname === target;
  }

  return (
    <nav className={`fixed left-0 right-0 top-0 z-[100] transition-[background,box-shadow] duration-300 ${navCls}`}>
      <div className="flex h-[58px] items-center justify-between px-4 md:h-[70px] md:px-12">
        <Link
          href="/"
          className={`flex flex-col items-start leading-tight transition-opacity ${
            brandVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!brandVisible}
        >
          <span className={`font-display text-lg font-medium -tracking-[0.01em] md:text-xl ${opaque ? 'text-ink' : 'text-white'}`}>
            My body goal
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${opaque ? 'text-ink-2/70' : 'text-white/75'}`}>
            By Kairos.Distribution
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = linkIsActive(l);
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

        <div className="flex items-center gap-2">
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
            className={`flex items-center gap-1.5 rounded-pill border px-3 py-2 text-[13px] font-semibold transition-colors md:px-4 ${
              opaque
                ? 'border-bordeaux bg-bordeaux text-white hover:bg-bordeaux-dark'
                : 'border-white/30 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30'
            }`}
            aria-label="Panier"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.5 12h11L21 7H6" />
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
            </svg>
            <span className="hidden md:inline">Panier</span>
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
            aria-label={mobile ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobile}
            className={`flex items-center justify-center rounded-full border p-2 transition lg:hidden ${
              opaque
                ? 'border-line-strong bg-cream-2 text-ink hover:bg-cream'
                : 'border-white/40 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50'
            }`}
          >
            {mobile ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`absolute left-0 right-0 origin-top overflow-hidden border-t border-line-soft bg-white shadow-lg transition-[max-height,opacity] duration-300 lg:hidden ${
          mobile ? 'max-h-[400px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-2">
          {LINKS.map((l) => {
            const active = linkIsActive(l);
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
          <div className="flex gap-1 rounded-pill bg-cream-2 p-1 my-3 sm:hidden">
            {CURRENCIES.map((c) => {
              const on = currency === c;
              return (
                <button
                  key={c}
                  onClick={() => pickCurrency(c)}
                  className={`flex-1 rounded-pill px-2 py-1.5 text-[11px] font-bold ${on ? 'bg-bordeaux text-white' : 'text-ink-2'}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
