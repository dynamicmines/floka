import type { Product, CartItem } from './product';
import { calculateOrder } from './money';
import { cartPayloadSchema } from './validation';
import type { z } from 'zod';
export function revalidateItems(
  requested: z.infer<typeof cartPayloadSchema>,
  catalog: Product[],
  expectedTotal: number,
) {
  const byId = new Map(catalog.map((p) => [p.externalId, p]));
  let unavailable = false;
  let changed = false;
  const items: CartItem[] = [];
  for (const input of requested) {
    const p = byId.get(input.externalId);
    if (!p || !p.available) {
      unavailable = true;
      continue;
    }
    const quantity = Math.min(
      input.quantity,
      p.stockQuantity === null ? 99 : Math.floor(p.stockQuantity),
    );
    if (quantity < input.quantity) unavailable = true;
    if (p.price !== input.expectedUnitPrice) changed = true;
    items.push({
      externalId: p.externalId,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      unitPrice: p.price,
      quantity,
    });
  }
  const totals = calculateOrder(items);
  if (totals.total !== expectedTotal) changed = true;
  if (!Number.isSafeInteger(totals.total) || totals.total > 2_000_000_000)
    throw new Error('Order exceeds supported total');
  return { items, totals, code: unavailable ? 'UNAVAILABLE' : changed ? 'PRICE_CHANGED' : null };
}
