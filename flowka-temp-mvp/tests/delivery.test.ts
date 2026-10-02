import { describe, it, expect } from 'vitest';
import { calculateDelivery, calculateOrder } from '@/lib/money';
import type { Category } from '@/lib/product';
const line = (category: Category, quantity: number) => ({ category, quantity });
describe('canonical delivery', () => {
  it.each([
    [[], 0],
    [[line('flowers', 1)], 2000],
    [[line('flowers', 2)], 2800],
    [[line('flowers', 3)], 3600],
    [[line('toys', 1)], 2000],
    [[line('toys', 5)], 2000],
    [[line('flowers', 1), line('toys', 2)], 2000],
    [[line('flowers', 2), line('toys', 2)], 2800],
    [[line('flowers', 1), line('flowers', 2)], 3600],
  ])('calculates %j → %i', (items, expected) => {
    expect(calculateDelivery(items as ReturnType<typeof line>[])).toBe(expected);
  });
  it('calculates authoritative integer subtotal and total', () => {
    expect(
      calculateOrder([
        { category: 'flowers', quantity: 2, unitPrice: 14040 },
        { category: 'toys', quantity: 3, unitPrice: 18000 },
      ]),
    ).toEqual({ subtotal: 82080, deliveryPrice: 2800, total: 84880 });
  });
});
