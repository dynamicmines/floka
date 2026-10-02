import 'server-only';
import { unstable_cache } from 'next/cache';
import { apiBase, nazdarFetch } from './client';
import { menuSchema, bouquetSchema } from './types';
import { isInMvpScope, normalizeProduct, imageUrl, integerKzt } from './normalize';
import { resolveProductPhoto, mapPhotos } from './photos';
import type { Product } from '@/lib/product';
export async function fetchCatalog(fresh = false): Promise<Product[]> {
  const first = menuSchema.parse(await nazdarFetch('/mobile/menu/?page=1&per_page=100', fresh));
  const raw = [...first.results];
  const visited = new Set<string>();
  let next = first.next;
  while (next) {
    const url = new URL(next, apiBase());
    if (
      url.origin !== new URL(apiBase()).origin ||
      url.pathname !== '/mobile/menu/' ||
      visited.has(url.href) ||
      visited.size >= 99
    )
      throw new Error('Invalid catalog pagination');
    visited.add(url.href);
    const page = menuSchema.parse(await nazdarFetch(url.href, fresh));
    raw.push(...page.results);
    next = page.next;
  }
  if (raw.length < first.count) throw new Error('Incomplete Nazdar catalog');
  const products = await mapPhotos(raw.filter(isInMvpScope), async (r) => ({
    ...normalizeProduct(r, apiBase()),
    ...(await resolveProductPhoto(r.image, r.sliders)),
  }));
  return [...new Map(products.map((p) => [p.id, p])).values()];
}
export const getCatalog = unstable_cache(
  () => fetchCatalog(),
  ['nazdar-catalog-v4-verified-dimensions'],
  {
    revalidate: 300,
  },
);
export async function getProduct(id: string): Promise<Product | undefined> {
  const product = (await getCatalog()).find((p) => p.id === id);
  if (!product || !id.startsWith('bouquet-')) return product;
  // Menu is authoritative for availability; details add richer presentation only.
  const detail = bouquetSchema.parse(await nazdarFetch(`/mobile/bouquets/${id.slice(8)}/`));
  const regular = integerKzt(detail.price);
  const discount = detail.discount_price == null ? null : integerKzt(detail.discount_price);
  const price = discount !== null && discount > 0 && discount < regular ? discount : regular;
  return {
    ...product,
    name: detail.name,
    description: detail.description || product.description,
    ...(await resolveProductPhoto(imageUrl(detail.preview_image) || product.imageUrl, [
      ...detail.sliders,
      ...(product.imageUrl ? [{ order: -1, slider_image: product.imageUrl }] : []),
    ])),
    price,
    oldPrice: price < regular ? regular : null,
    available: product.available && detail.exists,
  };
}
