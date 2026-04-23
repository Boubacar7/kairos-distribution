'use client';

import { useEffect, useState } from 'react';
import { api, formatPrice, Order } from '@/lib/api';
import { getToken } from '@/lib/auth';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [err, setErr] = useState('');

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      setOrders(await api.get<Order[]>('/orders', token));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const token = getToken();
    if (!token) return;
    await api.patch(`/orders/${id}/status`, { status }, token);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl">Commandes</h1>
      {err && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-[2fr_3fr]">
        <div className="card overflow-hidden">
          <ul className="divide-y divide-border">
            {orders.map((o) => (
              <li
                key={o.id}
                onClick={() => setSelected(o)}
                className={`cursor-pointer p-3 text-sm hover:bg-soft ${selected?.id === o.id ? 'bg-soft' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.code}</span>
                  <span className="text-xs text-primary">{o.status}</span>
                </div>
                <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleString('fr-FR')}</div>
                <div className="mt-1 text-xs">{formatPrice(o.total)}</div>
              </li>
            ))}
            {orders.length === 0 && <li className="p-4 text-sm text-muted">Aucune commande.</li>}
          </ul>
        </div>

        <div className="card p-5">
          {!selected ? (
            <p className="text-sm text-muted">Sélectionnez une commande à gauche.</p>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-xl">{selected.code}</div>
                  <div className="text-xs text-muted">Suivi : {selected.trackingCode}</div>
                </div>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected.id, e.target.value)}
                  className="input max-w-[200px]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 text-sm text-muted">
                {selected.buyerPhone} · {selected.buyerEmail}
              </div>
              <div className="mt-1 text-sm text-muted">
                {selected.shippingAddress} · {selected.shippingCity}
              </div>
              <ul className="mt-4 divide-y divide-border">
                {selected.items.map((it, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span>{it.name} × {it.quantity}</span>
                    <span>{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
                <span>Total</span>
                <span>{formatPrice(selected.total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
