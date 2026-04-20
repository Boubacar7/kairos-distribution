'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const CATS = [
  { id: 'all', label: 'Tous' },
  { id: 'Beauté', label: 'Beauté' },
  { id: 'Amincissant', label: 'Silhouette' },
  { id: 'Postérieur', label: 'Tonification' },
  { id: 'Promo', label: 'Promos' },
];

export default function CategoryStrip() {
  const params = useSearchParams();
  const active = params.get('cat') || 'all';

  return (
    <div className="cat-strip">
      <div className="cat-inner">
        {CATS.map((c) => {
          const href = c.id === 'all' ? '/produits' : `/produits?cat=${encodeURIComponent(c.id)}`;
          return (
            <Link
              key={c.id}
              href={href}
              className={`cat-btn ${active === c.id ? 'on' : ''}`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
