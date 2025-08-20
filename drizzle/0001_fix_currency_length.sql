-- Fix currency column length from 3 to 10 characters to support 'sbtc'
ALTER TABLE "products" ALTER COLUMN "currency" TYPE varchar(10);
ALTER TABLE "payment_intents" ALTER COLUMN "currency" TYPE varchar(10);