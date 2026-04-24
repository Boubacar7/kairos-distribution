// Server-side (SSR / RSC) calls run inside the Docker container, where
// "localhost" refers to the frontend container itself — not the backend.
// INTERNAL_API_URL lets us route server-side traffic through the internal
// Docker network (http://backend:4000). In the browser we keep
// NEXT_PUBLIC_API_URL (typically http://localhost:4000).
const BASE =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://backend:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Options = RequestInit & { token?: string };

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${BASE}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, token }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, token }),
  del: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  promo: number;
  stock: number;
  image?: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  variants?: Variant[];
};

export type Variant = {
  id: string;
  name: string;
  priceDelta: number;
  stock: number;
  attributes?: Record<string, unknown> | null;
};

export type OrderItem = {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  code: string;
  trackingCode: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingZone?: string | null;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  photoUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

export type Currency = 'FCFA' | 'EUR' | 'USD' | 'CAD';

const RATES: Record<Currency, number> = {
  FCFA: 1,
  EUR: 1 / 656,
  USD: 1 / 610,
  CAD: 1 / 445,
};

export function formatPrice(fcfa: number, currency: Currency = 'FCFA'): string {
  const v = fcfa * RATES[currency];
  if (currency === 'FCFA') {
    return `${Math.round(v).toLocaleString('fr-FR').replace(/,/g, ' ')} FCFA`;
  }
  if (currency === 'EUR') return `${v.toFixed(2).replace('.', ',')} €`;
  if (currency === 'USD') return `$${v.toFixed(2)}`;
  if (currency === 'CAD') return `CA$${v.toFixed(2)}`;
  return `${v.toFixed(2)} ${currency}`;
}
