ALTER TABLE "merchants" ADD COLUMN "recipient_address" varchar(255);--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "customer_email" varchar(255);