import type { Product } from './product';
export function filterCatalog(
  products: Product[],
  query: { q?: string; category?: string; price?: string; sort?: string },
) {
  const q = (query.q || '').toLocaleLowerCase().trim();
  const filtered = products.filter(
    (p) =>
      p.available &&
      (!q || [p.name, p.description, ...p.tags].join(' ').toLocaleLowerCase().includes(q)) &&
      (!query.category || query.category === 'all' || p.category === query.category) &&
      (!query.price ||
        query.price === 'all' ||
        (query.price === '0' && p.price <= 10000) ||
        (query.price === '1' && p.price >= 10000 && p.price <= 20000) ||
        (query.price === '2' && p.price >= 20000 && p.price <= 35000) ||
        (query.price === '3' && p.price >= 35000)),
  );
  return filtered.sort((a, b) =>
    query.sort === 'low'
      ? a.price - b.price
      : query.sort === 'high'
        ? b.price - a.price
        : query.sort === 'name'
          ? a.name.localeCompare(b.name, 'ru')
          : 0,
  );
}
