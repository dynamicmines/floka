'use client';
import { useEffect } from 'react';
import { useCart } from '@/store/cart';
export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return children;
}
