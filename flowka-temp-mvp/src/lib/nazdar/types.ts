import { z } from 'zod';
const amount = z.union([z.string(), z.number()]);
export const rawProductSchema = z.object({
  item_id: z.number().int().positive(),
  item_type: z.enum(['bouquet', 'product']),
  sell_item_id: z.number().int(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  price: amount,
  discount_price: amount.nullable().optional(),
  tags: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  exists: z.boolean(),
  status: z.string(),
  quantity: z.union([amount, z.null()]).optional(),
});
export const menuSchema = z.object({
  count: z.number().int().nonnegative(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(rawProductSchema),
});
export const bouquetSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable().optional(),
  preview_image: z.string().nullable().optional(),
  price: amount,
  discount_price: amount.nullable().optional(),
  exists: z.boolean(),
});
export type RawProduct = z.infer<typeof rawProductSchema>;
