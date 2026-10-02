'use client';
import { useState } from 'react';
import type { Product } from '@/lib/product';
import type { Locale } from '@/lib/i18n';
import { messages } from '@/lib/i18n';
import { useCart } from '@/store/cart';
import { Button } from './ui/button';
export function AddButton({
  product,
  locale,
  quantity = 1,
  className,
}: {
  product: Product;
  locale: Locale;
  quantity?: number;
  className?: string;
}) {
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const t = messages[locale];
  return (
    <Button
      className={className}
      disabled={!product.available}
      onClick={() => {
        add(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      aria-live="polite"
    >
      {product.available ? (added ? t.added : t.add) : t.unavailable}
    </Button>
  );
}
