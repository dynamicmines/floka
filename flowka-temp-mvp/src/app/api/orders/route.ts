import { z } from 'zod';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { orderPayloadSchema, normalizePhone, checkoutSchema } from '@/lib/validation';
import { fetchCatalog } from '@/lib/nazdar/catalog';
import { revalidateItems } from '@/lib/order-validation';
import { sameOrigin, readJson, rateLimit, apiError } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 403);
  let payload;
  try {
    const raw = await readJson(request);
    const locale = (raw as { locale?: string })?.locale === 'kz' ? 'kz' : 'ru';
    payload = orderPayloadSchema.extend({ customer: checkoutSchema(locale) }).parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json(
        {
          code: 'VALIDATION',
          fields: Object.fromEntries(
            error.issues.filter((i) => i.path[0] === 'customer').map((i) => [i.path[1], i.message]),
          ),
        },
        { status: 400 },
      );
    return apiError('VALIDATION', 400);
  }
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  try {
    if (!(await rateLimit(request, 'orders', 20, 10))) return apiError('RATE_LIMIT', 429);
    const existing = await db().query.orders.findFirst({
      where: eq(orders.requestId, payload.requestId),
    });
    if (existing)
      return existing.requestHash === hash
        ? Response.json({ receipt: existing.receiptToken })
        : apiError('IDEMPOTENCY_CONFLICT', 409);
    let catalog;
    try {
      catalog = await fetchCatalog(true);
    } catch {
      return apiError('CATALOG_UNAVAILABLE', 503);
    }
    const verified = revalidateItems(payload.items, catalog, payload.expectedTotal);
    if (verified.code)
      return Response.json(
        { code: verified.code, items: verified.items, ...verified.totals },
        { status: 409 },
      );
    const customer = payload.customer;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await db().transaction(async (tx) => {
          const [order] = await tx
            .insert(orders)
            .values({
              publicNumber: `FL-${randomInt(100000, 1000000)}`,
              requestId: payload.requestId,
              requestHash: hash,
              receiptToken: randomBytes(32).toString('hex'),
              ...customer,
              customerPhone: normalizePhone(customer.customerPhone),
              recipientName: customer.recipientIsCustomer
                ? customer.customerName
                : customer.recipientName,
              recipientPhone: normalizePhone(
                customer.recipientIsCustomer ? customer.customerPhone : customer.recipientPhone,
              ),
              city: 'Astana',
              ...verified.totals,
            })
            .returning();
          await tx.insert(orderItems).values(
            verified.items.map((i) => ({
              orderId: order.id,
              externalItemId: i.externalId,
              productName: i.name,
              productImage: i.imageUrl,
              productCategory: i.category,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              lineTotal: i.unitPrice * i.quantity,
            })),
          );
          return order;
        });
        return Response.json(
          { receipt: created.receiptToken },
          { status: 201, headers: { 'Cache-Control': 'no-store' } },
        );
      } catch (error) {
        const cause = (error as { cause?: { code?: string } }).cause;
        if (cause?.code !== '23505' && (error as { code?: string }).code !== '23505') throw error;
        const duplicate = await db().query.orders.findFirst({
          where: eq(orders.requestId, payload.requestId),
        });
        if (duplicate)
          return duplicate.requestHash === hash
            ? Response.json({ receipt: duplicate.receiptToken })
            : apiError('IDEMPOTENCY_CONFLICT', 409);
      }
    }
    return apiError('ORDER_FAILED', 503);
  } catch {
    return apiError('ORDER_FAILED', 503);
  }
}
