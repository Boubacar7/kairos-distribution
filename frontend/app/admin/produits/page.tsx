'use client';

import { useEffect, useState } from 'react';
import { api, formatPrice, Product } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, stock: 0, description: '', image: '' });

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await api.post('/products', form, token);
      setForm({ name: '', price: 0, stock: 0, description: '', image: '' });
      setCreating(false);
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    const token = getToken();
    if (!token) return;
    await api.del(`/products/${id}`, token);
    load();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Produits</h1>
        <button className="btn btn-primary" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Annuler' : 'Nouveau produit'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="card mt-4 grid gap-3 p-4 md:grid-cols-2">
          <div>
            <label className="label">Nom</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Image (URL)</label>
            <input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
          <div>
            <label className="label">Prix (centimes)</label>
            <input required type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Stock</label>
            <input required type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="btn btn-primary">Créer</button>
          </div>
        </form>
      )}

      {err && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="py-2">Nom</th>
              <th className="py-2">Prix</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Statut</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2">{p.name}</td>
                <td className="py-2">{formatPrice(p.price)}</td>
                <td className="py-2">{p.stock}</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2 text-right">
                  <button className="text-primary" onClick={() => handleDelete(p.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td className="py-4 text-muted" colSpan={5}>Aucun produit.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
