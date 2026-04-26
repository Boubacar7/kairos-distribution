'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, formatPrice, Product } from '@/lib/api';
import { getToken } from '@/lib/auth';

type FormState = {
  slug?: string;
  name: string;
  category: string;
  price: number;
  promo: number;
  stock: number;
  description: string;
  image: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
};

const EMPTY: FormState = {
  name: '',
  category: 'Beauté',
  price: 0,
  promo: 0,
  stock: 0,
  description: '',
  image: '',
  status: 'PUBLISHED',
};

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('all');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      setProducts(await api.get<Product[]>('/products', token));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  }

  function startEdit(p: Product) {
    setForm({
      slug: p.slug,
      name: p.name,
      category: p.category || 'Beauté',
      price: p.price,
      promo: p.promo || 0,
      stock: p.stock,
      description: p.description || '',
      image: p.image || '',
      status: p.status,
    });
    setEditing(p);
    setCreating(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      if (editing) {
        await api.patch<Product>(`/products/${editing.id}`, form, token);
        showToast('Produit mis à jour');
      } else {
        await api.post<Product>('/products', form, token);
        showToast('Produit créé');
      }
      setCreating(false);
      setEditing(null);
      setForm(EMPTY);
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    const token = getToken();
    if (!token) return;
    await api.del(`/products/${p.id}`, token);
    showToast('Produit supprimé');
    load();
  }

  async function quickStatusToggle(p: Product) {
    const token = getToken();
    if (!token) return;
    const next = p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await api.patch<Product>(`/products/${p.id}`, { status: next }, token);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    showToast(`${p.name} → ${next}`);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Produits</h1>
        <button className="btn btn-primary" onClick={creating ? () => setCreating(false) : startCreate}>
          {creating ? 'Annuler' : 'Nouveau produit'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit} className="card mt-4 grid gap-3 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="font-serif text-lg">{editing ? `Éditer « ${editing.name} »` : 'Nouveau produit'}</div>
          </div>
          <div>
            <label className="label">Nom</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Beauté</option>
              <option>Amincissant</option>
              <option>Postérieur</option>
              <option>Promo</option>
            </select>
          </div>
          <div>
            <label className="label">Prix (FCFA)</label>
            <input required type="number" min={0} className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Ancien prix (promo, FCFA)</label>
            <input type="number" min={0} className="input" value={form.promo} onChange={(e) => setForm({ ...form, promo: Number(e.target.value) })} />
            <span className="mt-1 block text-xs text-muted">Si supérieur au prix → badge PROMO + prix barré</span>
          </div>
          <div>
            <label className="label">Stock</label>
            <input required type="number" min={0} className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
            >
              <option value="PUBLISHED">Publié</option>
              <option value="DRAFT">Brouillon</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Image (URL ou /products/xxx.png)</label>
            <input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/products/glow-skin.png" />
            {form.image && (
              <div className="mt-2 h-24 w-24 overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt="aperçu" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button className="btn btn-primary">{editing ? 'Enregistrer' : 'Créer'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setCreating(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {err && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          placeholder="Rechercher (nom, slug, catégorie)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm flex-1"
        />
        {(['all', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              statusFilter === s ? 'border-primary bg-primary text-white' : 'border-border bg-white text-ink hover:bg-soft'
            }`}
          >
            {s === 'all' ? 'Tous' : s === 'PUBLISHED' ? 'Publiés' : s === 'DRAFT' ? 'Brouillons' : 'Archivés'}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2">Produit</th>
              <th className="px-3 py-2">Catégorie</th>
              <th className="px-3 py-2">Prix</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
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
                <td className="px-3 py-2">
                  <div>{formatPrice(p.price)}</div>
                  {p.promo > 0 && p.promo > p.price && (
                    <div className="text-xs text-muted line-through">{formatPrice(p.promo)}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.stock <= 0
                        ? 'bg-red-100 text-red-700'
                        : p.stock <= 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => quickStatusToggle(p)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                    title="Cliquer pour basculer publié/brouillon"
                  >
                    {p.status === 'PUBLISHED' ? 'Publié' : p.status === 'DRAFT' ? 'Brouillon' : 'Archivé'}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button className="text-primary hover:underline" onClick={() => startEdit(p)}>Éditer</button>
                  <span className="mx-2 text-muted">·</span>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(p)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
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
