'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CartLine, cartTotal, readCart, removeFromCart, updateQty } from '@/lib/cart';
import { formatPrice } from '@/lib/api';
import { useCurrency } from '@/lib/useCurrency';

export default function PanierPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const currency = useCurrency();

  useEffect(() => {
    const refresh = () => setLines(readCart());
    refresh();
    window.addEventListener('kairos:cart', refresh);
    return () => window.removeEventListener('kairos:cart', refresh);
  }, []);

  const total = cartTotal(lines);

  return (
    <section className="mx-auto max-w-4xl px-4 pt-[90px] pb-16">
      <h1 className="font-display text-[clamp(32px,5vw,48px)] -tracking-[0.03em]">Panier</h1>
      {lines.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-muted">Votre panier est vide.</p>
          <Link href="/produits" className="btn btn-primary mt-4">Voir la boutique</Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-line-soft rounded-lg border border-line-soft bg-white">
            {lines.map((l) => (
              <li key={`${l.productId}:${l.variantId || ''}`} className="flex items-center gap-4 p-4">
                <div className="h-20 w-20 overflow-hidden rounded-md bg-rose-50">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-sm text-muted">{formatPrice(l.price, currency)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-line-strong px-2"
                    onClick={() => updateQty(l.productId, l.quantity - 1, l.variantId)}
                  >−</button>
                  <span className="w-6 text-center text-sm">{l.quantity}</span>
                  <button
                    className="rounded-full border border-line-strong px-2"
                    onClick={() => updateQty(l.productId, l.quantity + 1, l.variantId)}
                  >+</button>
                </div>
                <div className="w-28 text-right font-medium">
                  {formatPrice(l.price * l.quantity, currency)}
                </div>
                <button
                  className="text-sm text-muted hover:text-bordeaux"
                  onClick={() => removeFromCart(l.productId, l.variantId)}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between rounded-lg border border-line-soft bg-white p-4">
            <span className="text-sm text-muted">Sous-total</span>
            <span className="font-display text-2xl">{formatPrice(total, currency)}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/checkout" className="btn btn-primary">Passer commande</Link>
          </div>
        </>
      )}
    </section>
  );
}
