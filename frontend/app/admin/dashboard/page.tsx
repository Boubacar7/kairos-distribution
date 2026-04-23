'use client';

import { useEffect, useState } from 'react';
import { api, formatPrice, Order, Product } from '@/lib/api';
import { getToken } from '@/lib/auth';

type Stats = {
  orders: Order[];
  products: Product[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([
      api.get<Order[]>('/orders', token),
      api.get<Product[]>('/products', token),
    ])
      .then(([orders, products]) => setData({ orders, products }))
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <div className="mx-auto max-w-6xl p-6 text-sm text-red-700">{err}</div>;
  if (!data) return <div className="mx-auto max-w-6xl p-6 text-sm text-muted">Chargement…</div>;

  const revenue = data.orders.reduce((acc, o) => acc + o.total, 0);
  const lowStock = data.products.filter((p) => p.stock > 0 && p.stock <= 5);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl">Tableau de bord</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs uppercase text-muted">Commandes</div>
          <div className="mt-1 text-3xl font-semibold">{data.orders.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-muted">Chiffre d&apos;affaires</div>
          <div className="mt-1 text-3xl font-semibold">{formatPrice(revenue)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase text-muted">Produits</div>
          <div className="mt-1 text-3xl font-semibold">{data.products.length}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-xl2 border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-medium text-yellow-900">Alerte stock bas</h3>
          <ul className="mt-2 text-sm text-yellow-900">
            {lowStock.map((p) => (
              <li key={p.id}>{p.name} — {p.stock} en stock</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 card p-5">
        <h2 className="font-serif text-xl">Dernières commandes</h2>
        <ul className="mt-3 divide-y divide-border">
          {data.orders.slice(0, 8).map((o) => (
            <li key={o.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{o.code}</div>
                <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-primary">{o.status}</span>
                <span className="font-medium">{formatPrice(o.total)}</span>
              </div>
            </li>
          ))}
          {data.orders.length === 0 && <li className="py-3 text-sm text-muted">Aucune commande.</li>}
        </ul>
      </div>
    </section>
  );
}
