'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatPrice } from '@/lib/api';
import { CartLine, cartTotal, clearCart, readCart } from '@/lib/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingZone: '',
    paymentMethod: 'CASH_ON_DELIVERY',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLines(readCart());
  }, []);

  const total = cartTotal(lines);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const order = await api.post<{ code: string; trackingCode: string }>('/orders', {
        ...form,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.quantity,
        })),
      });
      clearCart();
      router.push(`/compte?order=${order.code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 pt-[90px] pb-16">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] -tracking-[0.03em]">Commande</h1>
        <p className="mt-4 text-sm text-muted">Votre panier est vide.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl">Commande</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-serif text-lg">Vos coordonnées</h2>
          <div>
            <label className="label">Nom complet</label>
            <input required className="input" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input required className="input" value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">Adresse</label>
            <input required className="input" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ville</label>
              <input required className="input" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
            </div>
            <div>
              <label className="label">Zone</label>
              <input className="input" value={form.shippingZone} onChange={(e) => setForm({ ...form, shippingZone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Paiement</label>
            <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="CASH_ON_DELIVERY">Paiement à la livraison</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="BANK_TRANSFER">Virement</option>
            </select>
          </div>
        </div>
        <div>
          <h2 className="font-serif text-lg">Récapitulatif</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl2 border border-border bg-surface">
            {lines.map((l) => (
              <li key={`${l.productId}:${l.variantId || ''}`} className="flex justify-between p-3 text-sm">
                <span>{l.name} × {l.quantity}</span>
                <span>{formatPrice(l.priceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between rounded-xl2 border border-border bg-surface p-4">
            <span className="text-sm text-muted">Total</span>
            <span className="text-xl font-semibold">{formatPrice(total)}</span>
          </div>
          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button className="btn btn-primary mt-4 w-full" disabled={submitting}>
            {submitting ? 'Envoi…' : 'Confirmer la commande'}
          </button>
        </div>
      </form>
    </section>
  );
}
