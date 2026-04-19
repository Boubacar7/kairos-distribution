'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken, getToken } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/admin') {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace('/admin');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready) return null;

  if (pathname === '/admin') {
    return <>{children}</>;
  }

  const tabs = [
    { href: '/admin/dashboard', label: 'Tableau de bord' },
    { href: '/admin/produits', label: 'Produits' },
    { href: '/admin/commandes', label: 'Commandes' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="font-serif text-xl text-primary">
            Kairos · Admin
          </Link>
          <nav className="hidden gap-6 md:flex">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`text-sm ${pathname.startsWith(t.href) ? 'text-primary' : 'text-muted hover:text-primary'}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <button
            className="btn btn-outline text-sm"
            onClick={() => {
              clearToken();
              router.replace('/admin');
            }}
          >
            Déconnexion
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${pathname.startsWith(t.href) ? 'bg-primary text-white' : 'text-muted'}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
