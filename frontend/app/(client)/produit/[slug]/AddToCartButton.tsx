'use client';

import { useState } from 'react';
import { Product } from '@/lib/api';
import { addToCart } from '@/lib/cart';

export default function AddToCartButton({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      quantity: qty,
      imageUrl: product.imageUrl || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-full border border-border">
        <button className="px-3 py-1.5" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
        <span className="px-3 text-sm">{qty}</span>
        <button className="px-3 py-1.5" onClick={() => setQty((q) => q + 1)}>+</button>
      </div>
      <button
        className="btn btn-primary"
        disabled={product.stock <= 0}
        onClick={handleAdd}
      >
        {added ? '✓ Ajouté' : 'Ajouter au panier'}
      </button>
    </div>
  );
}
