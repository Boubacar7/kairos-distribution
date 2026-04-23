'use client';

import { useState } from 'react';
import { api, formatPrice, Order } from '@/lib/api';

export default function ComptePage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const params = new URLSearchParams();
      if (code) params.set('code', code);
      if (phone) params.set('phone', phone);
      const result = await api.get<Order>(`/orders/lookup?${params.toString()}`);
      setOrder(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Commande introuvable');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pt-[90px] pb-16">
      <span className="kicker">Espace client</span>
      <h1 className="mt-2 font-display text-[clamp(32px,5vw,48px)] -tracking-[0.03em]">Mon compte</h1>
      <p className="mt-1 text-sm text-muted">Consultez votre commande avec son code ou votre numéro.</p>
      <form onSubmit={handleLookup} className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="label">Code commande</label>
          <input className="input" placeholder="KD-2026-0001" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="md:col-span-1">
          <label className="label">ou Téléphone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
      </form>
      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {order && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif text-xl">{order.code}</div>
              <div className="text-xs text-muted">Suivi : {order.trackingCode}</div>
            </div>
            <span className="rounded-full bg-soft px-3 py-1 text-xs text-primary">{order.status}</span>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>{it.name} × {it.quantity}</span>
                <span>{formatPrice(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
