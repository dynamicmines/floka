import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { isAdmin } from '@/lib/auth';
import { adminMutationSchema } from '@/lib/validation';
import { sameOrigin, readJson, apiError } from '@/lib/http';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request) || !(await isAdmin())) return apiError('FORBIDDEN', 403);
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) return apiError('NOT_FOUND', 404);
  try {
    const parsed = adminMutationSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiError('VALIDATION', 400);
    const existing = await db().query.orders.findFirst({ where: eq(orders.id, id.data) });
    if (!existing) return apiError('NOT_FOUND', 404);
    const data = parsed.data;
    await db()
      .update(orders)
      .set({
        ...(data.status ? { status: data.status } : {}),
        ...(data.nazdarOrderNumber !== undefined
          ? { nazdarOrderNumber: data.nazdarOrderNumber || null }
          : {}),
        ...(data.status === 'SENT_TO_NAZDAR' && !existing.sentToNazdarAt
          ? { sentToNazdarAt: new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id.data));
    return Response.json({ ok: true });
  } catch {
    return apiError('UPDATE_FAILED', 503);
  }
}
