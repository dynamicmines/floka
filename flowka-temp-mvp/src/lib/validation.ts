import { z } from 'zod';
import ru from '@/messages/ru.json';
import kz from '@/messages/kz.json';
export function astanaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function normalizePhone(input: string) {
  let digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  return '+' + digits;
}
export function validPhone(value: string) {
  return /^[+\d\s()\-]+$/.test(value) && /^\+7[67]\d{9}$/.test(normalizePhone(value));
}
export function checkoutSchema(locale: 'ru' | 'kz' = 'ru') {
  const t = locale === 'ru' ? ru : kz;
  const name = z.string().trim().min(2, t.required).max(120, t.required);
  const phone = z.string().max(30, t.phoneError).refine(validPhone, t.phoneError);
  const optional = z.string().trim().max(1000, t.longError);
  return z
    .object({
      customerName: name,
      customerPhone: phone,
      recipientIsCustomer: z.boolean(),
      recipientName: z.string().trim().max(120, t.required),
      recipientPhone: z.string().max(30, t.phoneError),
      address: z.string().trim().min(5, t.required).max(300, t.longError),
      apartment: z.string().trim().max(80, t.longError),
      entrance: z.string().trim().max(40, t.longError),
      floor: z.string().trim().max(40, t.longError),
      intercom: z.string().trim().max(80, t.longError),
      deliveryDate: z
        .string()
        .refine(
          (v) =>
            /^\d{4}-\d{2}-\d{2}$/.test(v) &&
            !Number.isNaN(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v &&
            v >= astanaToday(),
          t.dateError,
        ),
      deliveryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, t.timeError),
      courierComment: optional,
      cardText: optional,
      customerComment: optional,
    })
    .strict()
    .superRefine((v, ctx) => {
      if (!v.recipientIsCustomer) {
        if (v.recipientName.length < 2)
          ctx.addIssue({ code: 'custom', path: ['recipientName'], message: t.required });
        if (!validPhone(v.recipientPhone))
          ctx.addIssue({ code: 'custom', path: ['recipientPhone'], message: t.phoneError });
      }
    });
}
export type CheckoutValues = z.infer<ReturnType<typeof checkoutSchema>>;
export const cartPayloadSchema = z
  .array(
    z
      .object({
        externalId: z.string().regex(/^(bouquet|product)-[1-9]\d{0,9}$/),
        quantity: z.number().int().min(1).max(99),
        expectedUnitPrice: z.number().int().nonnegative().max(100_000_000),
      })
      .strict(),
  )
  .min(1)
  .max(50)
  .refine(
    (items) => new Set(items.map((i) => i.externalId)).size === items.length,
    'Duplicate products',
  );
export const orderPayloadSchema = z
  .object({
    locale: z.enum(['ru', 'kz']),
    requestId: z.string().uuid(),
    expectedTotal: z.number().int().nonnegative().max(2_000_000_000),
    customer: checkoutSchema(),
    items: cartPayloadSchema,
  })
  .strict();
export const adminLoginSchema = z
  .object({ email: z.string().email().max(254), password: z.string().min(1).max(128) })
  .strict();
export const statuses = [
  'NEW',
  'CONFIRMED',
  'SENT_TO_NAZDAR',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
] as const;
export const statusLabels: Record<(typeof statuses)[number], string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  SENT_TO_NAZDAR: 'Передан Nazdar',
  DELIVERING: 'Доставляется',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменен',
};
export const adminMutationSchema = z
  .object({
    status: z.enum(statuses).optional(),
    nazdarOrderNumber: z
      .string()
      .trim()
      .max(120)
      .regex(/^[\p{L}\p{N}\s._/#-]*$/u)
      .optional(),
  })
  .strict()
  .refine((v) => v.status !== undefined || v.nazdarOrderNumber !== undefined);
