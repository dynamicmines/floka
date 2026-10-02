import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  date,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const orderStatus = pgEnum('order_status', [
  'NEW',
  'CONFIRMED',
  'SENT_TO_NAZDAR',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
]);
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicNumber: varchar('public_number', { length: 24 }).notNull().unique(),
    requestId: uuid('request_id').notNull().unique(),
    requestHash: text('request_hash').notNull(),
    receiptToken: text('receipt_token').notNull().unique(),
    status: orderStatus('status').notNull().default('NEW'),
    customerName: varchar('customer_name', { length: 120 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 16 }).notNull(),
    recipientName: varchar('recipient_name', { length: 120 }).notNull(),
    recipientPhone: varchar('recipient_phone', { length: 16 }).notNull(),
    recipientIsCustomer: boolean('recipient_is_customer').notNull(),
    city: varchar('city', { length: 32 }).notNull().default('Astana'),
    address: varchar('address', { length: 300 }).notNull(),
    apartment: varchar('apartment', { length: 80 }),
    entrance: varchar('entrance', { length: 40 }),
    floor: varchar('floor', { length: 40 }),
    intercom: varchar('intercom', { length: 80 }),
    deliveryDate: date('delivery_date').notNull(),
    deliveryTime: varchar('delivery_time', { length: 5 }).notNull(),
    cardText: text('card_text'),
    customerComment: text('customer_comment'),
    courierComment: text('courier_comment'),
    subtotal: integer('subtotal').notNull(),
    deliveryPrice: integer('delivery_price').notNull(),
    total: integer('total').notNull(),
    nazdarOrderNumber: varchar('nazdar_order_number', { length: 120 }),
    sentToNazdarAt: timestamp('sent_to_nazdar_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('orders_created_idx').on(t.createdAt),
    index('orders_status_idx').on(t.status),
    check(
      'orders_totals_check',
      sql`${t.subtotal} >= 0 AND ${t.deliveryPrice} >= 0 AND ${t.total} = ${t.subtotal} + ${t.deliveryPrice}`,
    ),
  ],
);
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    externalItemId: varchar('external_item_id', { length: 40 }).notNull(),
    productName: text('product_name').notNull(),
    productImage: text('product_image'),
    productCategory: varchar('product_category', { length: 16 }).notNull(),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: integer('line_total').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    check(
      'items_math_check',
      sql`${t.quantity} BETWEEN 1 AND 99 AND ${t.unitPrice} >= 0 AND ${t.lineTotal} = ${t.unitPrice} * ${t.quantity}`,
    ),
    check('items_category_check', sql`${t.productCategory} IN ('flowers','toys')`),
  ],
);
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
