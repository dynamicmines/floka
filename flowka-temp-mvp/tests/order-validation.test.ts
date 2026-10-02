import { it, expect } from 'vitest';
import { revalidateItems } from '@/lib/order-validation';
import type { Product } from '@/lib/product';
const p: Product = {
  id: 'bouquet-4',
  externalId: 'bouquet-4',
  name: 'Current name',
  description: '',
  price: 14040,
  oldPrice: null,
  category: 'flowers',
  available: true,
  tags: [],
  stockQuantity: null,
};
const requested = [{ externalId: p.id, quantity: 2, expectedUnitPrice: p.price }];
it('takes prices and categories from current catalog only', () => {
  expect(revalidateItems(requested, [p], 30880)).toMatchObject({
    code: null,
    totals: { subtotal: 28080, deliveryPrice: 2800, total: 30880 },
  });
});
it('requires resubmission when prices change', () => {
  expect(revalidateItems(requested, [{ ...p, price: 15000 }], 30880)).toMatchObject({
    code: 'PRICE_CHANGED',
    totals: { total: 32800 },
  });
});
it('requires resubmission when the client total or category is stale', () => {
  expect(revalidateItems(requested, [{ ...p, category: 'toys' }], 30880).code).toBe(
    'PRICE_CHANGED',
  );
});
it('rejects disappeared, unavailable and insufficient stock', () => {
  expect(revalidateItems(requested, [], 30880).code).toBe('UNAVAILABLE');
  expect(revalidateItems(requested, [{ ...p, available: false }], 30880).items).toEqual([]);
  expect(revalidateItems(requested, [{ ...p, stockQuantity: 1 }], 30880).items[0].quantity).toBe(1);
});
it('creates current product snapshots', () => {
  expect(revalidateItems(requested, [p], 30880).items[0]).toMatchObject({
    name: 'Current name',
    unitPrice: 14040,
    category: 'flowers',
    quantity: 2,
  });
});
