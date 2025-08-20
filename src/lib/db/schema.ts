import { pgTable, uuid, varchar, text, bigint, decimal, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'pending', 
  'succeeded',
  'failed',
  'canceled'
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'unpaid'
]);

export const productTypeEnum = pgEnum('product_type', [
  'one_time',
  'subscription'
]);

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  apiKeyLive: varchar('api_key_live', { length: 255 }).unique(),
  apiKeyTest: varchar('api_key_test', { length: 255 }).unique(),
  webhookUrl: varchar('webhook_url', { length: 500 }),
  webhookSecret: varchar('webhook_secret', { length: 255 }),
  stacksAddress: varchar('stacks_address', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: varchar('id', { length: 255 }).primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: productTypeEnum('type').default('one_time').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(), // Price in microsBTC
  priceUsd: decimal('price_usd', { precision: 10, scale: 2 }), // USD equivalent
  currency: varchar('currency', { length: 10 }).default('sbtc').notNull(),
  images: jsonb('images').$type<string[]>().default([]),
  metadata: jsonb('metadata'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentIntents = pgTable('payment_intents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  productId: varchar('product_id', { length: 255 }).references(() => products.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  amountUsd: decimal('amount_usd', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('sbtc').notNull(),
  status: paymentStatusEnum('status').default('created').notNull(),
  customerAddress: varchar('customer_address', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  description: text('description'),
  metadata: jsonb('metadata'),
  txId: varchar('tx_id', { length: 255 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: varchar('id', { length: 255 }).primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  customerAddress: varchar('customer_address', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('sbtc').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }),
  data: jsonb('data').notNull(),
  delivered: boolean('delivered').default(false).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  customerAddress: varchar('customer_address', { length: 255 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  interval: varchar('interval', { length: 50 }).notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiRequests = pgTable('api_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').references(() => merchants.id).notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type NewPaymentIntent = typeof paymentIntents.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;