'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/lib/product';
type State = {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
};
export const useCart = create<State>()(
  persist(
    (set) => ({
      items: [],
      add: (p, quantity = 1) =>
        set((s) => {
          const current = s.items.find((i) => i.externalId === p.externalId);
          const item: CartItem = {
            externalId: p.externalId,
            name: p.name,
            imageUrl: p.imageUrl,
            category: p.category,
            unitPrice: p.price,
            quantity: Math.min(99, (current?.quantity || 0) + quantity),
          };
          return {
            items: current
              ? s.items.map((i) => (i.externalId === p.externalId ? item : i))
              : [...s.items, item],
          };
        }),
      setQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.externalId === id
              ? { ...i, quantity: Math.max(1, Math.min(99, Math.trunc(quantity))) }
              : i,
          ),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.externalId !== id) })),
      replace: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'flowka-temp-cart-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
