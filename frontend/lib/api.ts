const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  priceCents: number;
  compareAtCents?: number | null;
  currency: string;
  imageUrl?: string | null;
  stock: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  tags?: string[];
  variants?: Variant[];
};

export type Variant = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  sku?: string | null;
};

export type OrderItem = {
  productId: string;
  variantId?: string | null;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  code: string;
  trackingCode: string;
  status: string;
  totalCents: number;
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

export const formatPrice = (cents: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);
