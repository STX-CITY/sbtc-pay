CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'succeeded', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('one_time', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid');--> statement-breakpoint
CREATE TABLE "api_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"api_key_live" varchar(255),
	"api_key_test" varchar(255),
	"webhook_url" varchar(500),
	"webhook_secret" varchar(255),
	"stacks_address" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_email_unique" UNIQUE("email"),
	CONSTRAINT "merchants_api_key_live_unique" UNIQUE("api_key_live"),
	CONSTRAINT "merchants_api_key_test_unique" UNIQUE("api_key_test")
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"merchant_id" uuid NOT NULL,
	"product_id" varchar(255),
	"amount" bigint NOT NULL,
	"amount_usd" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'sbtc' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"customer_address" varchar(255),
	"description" text,
	"metadata" jsonb,
	"tx_id" varchar(255),
	"receipt_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_address" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'sbtc' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"merchant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "product_type" DEFAULT 'one_time' NOT NULL,
	"price" bigint NOT NULL,
	"price_usd" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'sbtc' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"merchant_id" uuid NOT NULL,
	"customer_address" varchar(255) NOT NULL,
	"amount" bigint NOT NULL,
	"interval" varchar(50) NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payment_intent_id" varchar(255),
	"data" jsonb NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_requests" ADD CONSTRAINT "api_requests_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;