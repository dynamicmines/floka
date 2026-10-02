import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeProduct,
  classifyNazdarProduct,
  integerKzt,
  imageUrl,
  isInMvpScope,
} from '@/lib/nazdar/normalize';
import { menuSchema, type RawProduct } from '@/lib/nazdar/types';
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
import { fetchCatalog } from '@/lib/nazdar/catalog';
const raw: RawProduct = {
  sliders: [],
  item_id: 4,
  item_type: 'bouquet',
  sell_item_id: 176,
  name: 'Букет',
  description: 'Розы',
  image: '/media/preview/image.jpg',
  price: '15600.00',
  discount_price: '14040.00',
  tags: [],
  exists: true,
  status: 'available',
  quantity: null,
};
afterEach(() => vi.unstubAllGlobals());
describe('Nazdar normalization', () => {
  it('normalizes real observed decimal strings and discounted prices', () => {
    const p = normalizeProduct(raw);
    expect(p).toMatchObject({
      id: 'bouquet-4',
      externalId: 'bouquet-4',
      price: 14040,
      oldPrice: 15600,
      category: 'flowers',
      available: true,
    });
    expect(p.imageUrl).toBe('https://api.crm.nazdar.kz/media/preview/image.jpg');
  });
  it('distinguishes overlapping item IDs by type', () => {
    expect(normalizeProduct({ ...raw, item_type: 'product' }).id).toBe('product-4');
  });
  it('does not invent discounts', () => {
    expect(normalizeProduct({ ...raw, discount_price: '16000.00' })).toMatchObject({
      price: 15600,
      oldPrice: null,
    });
  });
  it('recognizes toy tag ID, toy names, and explicit flower fallback', () => {
    expect(
      classifyNazdarProduct({
        ...raw,
        item_type: 'product',
        tags: [{ id: 4, name: 'Мягкие игрушки' }],
      }),
    ).toBe('toys');
    expect(classifyNazdarProduct({ ...raw, item_type: 'product', name: 'Игрушка XXL' })).toBe(
      'toys',
    );
    expect(classifyNazdarProduct({ ...raw, item_type: 'product' })).toBe('flowers');
  });
  it('keeps botanical products but excludes sweets and accessories', () => {
    expect(
      isInMvpScope({ ...raw, item_type: 'product', tags: [{ id: 2, name: 'Комнатные растения' }] }),
    ).toBe(true);
    expect(
      isInMvpScope({ ...raw, item_type: 'product', tags: [{ id: 25, name: 'Открытки' }] }),
    ).toBe(false);
  });
  it.each([{ exists: false }, { status: 'unavailable' }, { quantity: '0.00' }])(
    'rejects clearly unavailable stock: %j',
    (flags) => expect(normalizeProduct({ ...raw, ...flags }).available).toBe(false),
  );
  it('rejects fractional/unsafe/invalid money', () => {
    for (const price of ['10.50', '-1', 'NaN', '100000001'])
      expect(() => integerKzt(price)).toThrow();
  });
  it('does not accept unsafe image origins or protocols', () => {
    expect(imageUrl('javascript:alert(1)')).toBeUndefined();
    expect(imageUrl('https://evil.test/image.jpg')).toBeUndefined();
  });
  it('validates the observed envelope', () => {
    expect(
      menuSchema.parse({ count: 1, next: null, previous: null, results: [raw] }).results,
    ).toHaveLength(1);
  });
  it('follows actual next links, combines pages and deduplicates', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          count: 2,
          next: 'https://api.crm.nazdar.kz/mobile/menu/?page=2&per_page=100',
          previous: null,
          results: [raw],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ count: 2, next: null, previous: null, results: [{ ...raw, item_id: 5 }] }),
      );
    vi.stubGlobal('fetch', fetch);
    expect(await fetchCatalog(true)).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/mobile/menu/'))).toHaveLength(2);
    expect(fetch.mock.calls[0][1].cache).toBe('no-store');
  });
  it('refuses pagination SSRF and incomplete results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          count: 2,
          next: 'https://evil.test/mobile/menu/',
          previous: null,
          results: [raw],
        }),
      ),
    );
    await expect(fetchCatalog(true)).rejects.toThrow('pagination');
  });
  it('fails closed on upstream errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchCatalog(true)).rejects.toThrow('Nazdar');
  });
});
