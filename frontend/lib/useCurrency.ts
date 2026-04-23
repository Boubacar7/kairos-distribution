'use client';

import { useEffect, useState } from 'react';
import { Currency } from './api';

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>('FCFA');

  useEffect(() => {
    const read = () => {
      try {
        const v = localStorage.getItem('kairos_currency') as Currency | null;
        if (v === 'FCFA' || v === 'EUR' || v === 'USD') setCurrency(v);
      } catch {}
    };
    read();
    window.addEventListener('kairos:currency', read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('kairos:currency', read);
      window.removeEventListener('storage', read);
    };
  }, []);

  return currency;
}
