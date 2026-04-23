'use client';

export type CartLine = {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

const KEY = 'kairos_cart_v2';

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent('kairos:cart'));
}

export function addToCart(line: CartLine) {
  const lines = readCart();
  const key = `${line.productId}:${line.variantId || ''}`;
  const existing = lines.find((l) => `${l.productId}:${l.variantId || ''}` === key);
  if (existing) existing.quantity += line.quantity;
  else lines.push(line);
  writeCart(lines);
}

export function removeFromCart(productId: string, variantId?: string) {
  writeCart(readCart().filter((l) => !(l.productId === productId && (l.variantId || '') === (variantId || ''))));
}

export function updateQty(productId: string, quantity: number, variantId?: string) {
  const lines = readCart().map((l) =>
    l.productId === productId && (l.variantId || '') === (variantId || '') ? { ...l, quantity } : l,
  );
  writeCart(lines.filter((l) => l.quantity > 0));
}

export function clearCart() {
  writeCart([]);
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.price * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}
