'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, formatPrice, Product } from '@/lib/api';
import { getToken } from '@/lib/auth';

const LOW_STOCK = 5;

type StockFilter = 'all' | 'low' | 'out' | 'ok';
type SortKey = 'name' | 'category' | 'stock' | 'price';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('stock');
  const [sortAsc, setSortAsc] = useState(true);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [toast, setToast] = useState('');

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setProducts(await api.get<Product[]>('/products', token));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products;
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q),
      );
    }
    if (filter === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK);
    else if (filter === 'out') list = list.filter((p) => p.stock <= 0);
    else if (filter === 'ok') list = list.filter((p) => p.stock > LOW_STOCK);

    list = [...list].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortBy === 'name') {
        av = a.name;
        bv = b.name;
      } else if (sortBy === 'category') {
        av = a.category || '';
        bv = b.category || '';
      } else if (sortBy === 'stock') {
        av = a.stock;
        bv = b.stock;
      } else if (sortBy === 'price') {
        av = a.price;
        bv = b.price;
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, search, filter, sortBy, sortAsc]);

  const counts = useMemo(() => {
    const out = products.filter((p) => p.stock <= 0).length;
    const low = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;
    const valuation = products.reduce((acc, p) => acc + p.stock * p.price, 0);
    return { out, low, valuation };
  }, [products]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }

  function toggleSort(key: SortKey) {
    if (key === sortBy) setSortAsc((v) => !v);
    else {
      setSortBy(key);
      setSortAsc(true);
    }
  }

  async function commitStock(p: Product, newStock: number) {
    const token = getToken();
    if (!token) return;
    const next = Math.max(0, Math.floor(newStock));
    try {
      await api.patch<Product>(`/products/${p.id}`, { stock: next }, token);
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock: next } : x)));
      showToast(`${p.name} → ${next}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setPending((prev) => {
        const cp = { ...prev };
        delete cp[p.id];
        return cp;
      });
    }
  }

  function setPendingFor(id: string, value: number) {
    setPending((prev) => ({ ...prev, [id]: value }));
  }

  function increment(p: Product, delta: number) {
    const current = pending[p.id] ?? p.stock;
    const next = Math.max(0, current + delta);
    setPendingFor(p.id, next);
    void commitStock(p, next);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Suivi des stocks</h1>
          <p className="text-sm text-muted">
            Modifie les quantités directement dans le tableau. Sauvegarde automatique.
          </p>
        </div>
        <button onClick={load} className="btn btn-outline text-sm" disabled={loading}>
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Stat title="Produits" value={`${products.length}`} />
        <Stat title="Rupture" value={`${counts.out}`} tone={counts.out > 0 ? 'danger' : 'ok'} />
        <Stat title="Stock bas" value={`${counts.low}`} tone={counts.low > 0 ? 'warn' : 'ok'} />
        <Stat title="Valorisation" value={formatPrice(counts.valuation)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          placeholder="Rechercher (nom, slug, catégorie)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm flex-1"
        />
        <FilterPill label="Tout" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterPill label="Stock OK" active={filter === 'ok'} onClick={() => setFilter('ok')} />
        <FilterPill label={`Bas (${counts.low})`} active={filter === 'low'} onClick={() => setFilter('low')} tone="warn" />
        <FilterPill label={`Rupture (${counts.out})`} active={filter === 'out'} onClick={() => setFilter('out')} tone="danger" />
      </div>

      {err && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 overflow-x-auto rounded-xl2 border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-soft text-left text-xs uppercase tracking-wide text-muted">
              <SortHeader label="Produit" onClick={() => toggleSort('name')} active={sortBy === 'name'} asc={sortAsc} />
              <SortHeader label="Catégorie" onClick={() => toggleSort('category')} active={sortBy === 'category'} asc={sortAsc} />
              <SortHeader label="Prix" onClick={() => toggleSort('price')} active={sortBy === 'price'} asc={sortAsc} />
              <SortHeader label="Stock" onClick={() => toggleSort('stock')} active={sortBy === 'stock'} asc={sortAsc} />
              <th className="px-3 py-2 text-right">Ajuster</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const status = p.stock <= 0 ? 'out' : p.stock <= LOW_STOCK ? 'low' : 'ok';
              const colorRow = status === 'out' ? 'bg-red-50/50' : status === 'low' ? 'bg-yellow-50/50' : '';
              const value = pending[p.id] ?? p.stock;
              return (
                <tr key={p.id} className={`border-b border-border last:border-0 ${colorRow}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-md bg-rose-50">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted">{p.category}</td>
                  <td className="px-3 py-2">{formatPrice(p.price)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        status === 'out'
                          ? 'bg-red-100 text-red-700'
                          : status === 'low'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-full border border-border px-2 hover:bg-soft"
                        onClick={() => increment(p, -1)}
                        aria-label="Retirer 1"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={value}
                        onChange={(e) => setPendingFor(p.id, Number(e.target.value))}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n) && n !== p.stock) commitStock(p, n);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-20 rounded-md border border-border bg-white px-2 py-1 text-center text-sm"
                      />
                      <button
                        className="rounded-full border border-border px-2 hover:bg-soft"
                        onClick={() => increment(p, +1)}
                        aria-label="Ajouter 1"
                      >
                        +
                      </button>
                      <button
                        className="rounded-full border border-border px-2 text-xs hover:bg-soft"
                        onClick={() => increment(p, +10)}
                        aria-label="Ajouter 10"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">
                  Aucun produit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </section>
  );
}

function Stat({
  title,
  value,
  tone = 'ok',
}: {
  title: string;
  value: string;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  const accent = tone === 'danger' ? 'text-red-700' : tone === 'warn' ? 'text-yellow-700' : 'text-ink';
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
      <div className={`mt-1 font-serif text-2xl ${accent}`}>{value}</div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  tone = 'ok',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  const colors = active
    ? tone === 'danger'
      ? 'bg-red-600 text-white border-red-600'
      : tone === 'warn'
        ? 'bg-yellow-500 text-white border-yellow-500'
        : 'bg-primary text-white border-primary'
    : 'bg-white text-ink border-border hover:bg-soft';
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${colors}`}>
      {label}
    </button>
  );
}

function SortHeader({
  label,
  onClick,
  active,
  asc,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  asc: boolean;
}) {
  return (
    <th className="cursor-pointer select-none px-3 py-2" onClick={onClick}>
      <span className={active ? 'text-primary' : ''}>
        {label} {active ? (asc ? '↑' : '↓') : ''}
      </span>
    </th>
  );
}
