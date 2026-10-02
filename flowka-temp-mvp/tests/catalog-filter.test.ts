import { it, expect } from 'vitest';
import { filterCatalog } from '@/lib/catalog-filter';
import type { Product } from '@/lib/product';
const base: Product = {
  id: 'bouquet-4',
  externalId: 'bouquet-4',
  name: 'Розы',
  description: 'Нежный букет',
  price: 10000,
  oldPrice: null,
  available: true,
  category: 'flowers',
  tags: ['Красный'],
  stockQuantity: null,
};
const items = [
  base,
  { ...base, id: 'product-24', name: 'Игрушка', category: 'toys' as const, price: 20000 },
  { ...base, id: 'bouquet-5', price: 35000 },
  { ...base, id: 'bouquet-6', available: false },
];
it('combines search/category/price/sort', () =>
  expect(
    filterCatalog(items, { q: 'красный', category: 'flowers', price: '1', sort: 'high' }).map(
      (p) => p.id,
    ),
  ).toEqual(['bouquet-4']));
it('includes the advertised price range endpoints', () => {
  expect(filterCatalog(items, { price: '0' })).toHaveLength(1);
  expect(filterCatalog(items, { price: '1' })).toHaveLength(2);
  expect(filterCatalog(items, { price: '2' })).toHaveLength(2);
  expect(filterCatalog(items, { price: '3' })).toHaveLength(1);
});
it('sorts prices and searches descriptions', () => {
  expect(filterCatalog(items, { sort: 'high' })[0].price).toBe(35000);
  expect(filterCatalog(items, { q: 'нежный' })).toHaveLength(3);
});
