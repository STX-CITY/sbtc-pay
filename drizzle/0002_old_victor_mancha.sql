CREATE TABLE "payment_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"product_id" varchar(255),
	"link_code" varchar(255) NOT NULL,
	"email" varchar(255),
	"metadata" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_by" varchar(255),
	"notes" text,
	CONSTRAINT "payment_links_link_code_unique" UNIQUE("link_code")
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"description" text,
	"events" varchar(1000) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"secret" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "checkout_redirect_url" varchar(500);--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "source_link_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "webhook_endpoint_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "last_attempted_at" timestamp;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "next_retry_at" timestamp;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "response_status" integer;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "response_body" text;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhook_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE no action ON UPDATE no action;