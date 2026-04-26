'use client';

import Link from 'next/link';
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
  const outOfStock = data.products.filter((p) => p.stock <= 0);
  const stockValuation = data.products.reduce((acc, p) => acc + p.stock * p.price, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl">Tableau de bord</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat title="Commandes" value={`${data.orders.length}`} />
        <Stat title="Chiffre d'affaires" value={formatPrice(revenue)} />
        <Stat title="Produits" value={`${data.products.length}`} />
        <Stat title="Valorisation stock" value={formatPrice(stockValuation)} />
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mt-6 rounded-xl2 border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-yellow-900">
              Alertes stock {outOfStock.length > 0 && <span className="text-red-700">({outOfStock.length} en rupture)</span>}
            </h3>
            <Link href="/admin/stock" className="text-sm font-medium text-yellow-900 underline">
              Gérer le stock →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-yellow-200/60 text-sm text-yellow-900">
            {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1.5">
                <span>{p.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-200/70 text-yellow-900'
                  }`}
                >
                  {p.stock <= 0 ? 'Rupture' : `${p.stock} en stock`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm text-primary">Tout voir →</Link>
        </div>
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

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase text-muted">{title}</div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
