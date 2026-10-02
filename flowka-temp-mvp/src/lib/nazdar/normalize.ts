import type { Product, Category } from '@/lib/product';
import type { RawProduct } from './types';
export function classifyNazdarProduct(raw: RawProduct): Category {
  if (raw.item_type === 'bouquet') return 'flowers';
  if (
    raw.tags.some((t) => t.id === 4 || /игруш|toy|ойыншық/i.test(t.name)) ||
    /игруш|toy|ойыншық/i.test(raw.name)
  )
    return 'toys';
  return 'flowers'; // Explicit fallback for botanical and unknown entries; scope eligibility is separate.
}
export function isInMvpScope(raw: RawProduct) {
  return (
    raw.item_type === 'bouquet' ||
    classifyNazdarProduct(raw) === 'toys' ||
    raw.tags.some((t) => t.id === 2)
  );
}
export function integerKzt(value: string | number): number {
  const text = String(value);
  if (!/^\d+(?:\.0+)?$/.test(text)) throw new Error('Nazdar price is not whole KZT');
  const result = Number(text);
  if (!Number.isSafeInteger(result) || result > 100_000_000)
    throw new Error('Invalid Nazdar price');
  return result;
}
export function imageUrl(path?: string | null, base = 'https://api.crm.nazdar.kz') {
  if (!path) return undefined;
  try {
    const url = new URL(path, base);
    return url.protocol === 'https:' &&
      url.hostname === 'api.crm.nazdar.kz' &&
      url.pathname.startsWith('/media/')
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function normalizeProduct(raw: RawProduct, base?: string): Product {
  const regular = integerKzt(raw.price);
  const discount = raw.discount_price == null ? null : integerKzt(raw.discount_price);
  const price = discount !== null && discount > 0 && discount < regular ? discount : regular;
  const stockQuantity = raw.quantity == null ? null : Number(raw.quantity);
  if (stockQuantity !== null && (!Number.isFinite(stockQuantity) || stockQuantity < 0))
    throw new Error('Invalid stock');
  const id = `${raw.item_type}-${raw.item_id}`;
  return {
    id,
    externalId: id,
    name: raw.name,
    description: raw.description || '',
    imageUrl: imageUrl(raw.image, base),
    price,
    oldPrice: price < regular ? regular : null,
    category: classifyNazdarProduct(raw),
    tags: raw.tags.map((t) => t.name),
    available:
      raw.exists && raw.status === 'available' && (stockQuantity === null || stockQuantity >= 1),
    stockQuantity,
  };
}
