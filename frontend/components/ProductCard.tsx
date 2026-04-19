import Link from 'next/link';
import { formatPrice, Product } from '@/lib/api';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produit/${product.slug}`}
      className="card block overflow-hidden transition hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-soft">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Pas d&apos;image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-primary font-semibold">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          {product.compareAtCents ? (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compareAtCents, product.currency)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
