-- SQL Migration for Payment Links Feature
-- This file contains the SQL commands to enhance your database for the payment links feature

-- =====================================================
-- OPTIONAL: Create payment_links table for tracking generated links
-- =====================================================
-- This table is optional but recommended if you want to:
-- 1. Track which payment links were generated
-- 2. Add expiration dates to links
-- 3. Monitor link usage analytics
-- 4. Enable/disable specific links

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  product_id VARCHAR(255) REFERENCES products(id),
  link_code VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  metadata JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  -- Additional tracking fields
  created_by VARCHAR(255),
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_links_merchant_id ON payment_links(merchant_id);
CREATE INDEX idx_payment_links_product_id ON payment_links(product_id);
CREATE INDEX idx_payment_links_link_code ON payment_links(link_code);
CREATE INDEX idx_payment_links_email ON payment_links(email);
CREATE INDEX idx_payment_links_created_at ON payment_links(created_at DESC);
CREATE INDEX idx_payment_links_is_active ON payment_links(is_active) WHERE is_active = true;

-- =====================================================
-- Add metadata index on payment_intents for better query performance
-- =====================================================
-- This index helps with querying payment intents by metadata fields
CREATE INDEX IF NOT EXISTS idx_payment_intents_metadata 
ON payment_intents USING gin(metadata);

-- =====================================================
-- OPTIONAL: Add column to track payment link source
-- =====================================================
-- This allows you to track which payment intents came from generated links
ALTER TABLE payment_intents 
ADD COLUMN IF NOT EXISTS source_link_id UUID REFERENCES payment_links(id);

-- Create index for the source link
CREATE INDEX IF NOT EXISTS idx_payment_intents_source_link 
ON payment_intents(source_link_id);

-- =====================================================
-- OPTIONAL: Create view for payment link analytics
-- =====================================================
CREATE OR REPLACE VIEW payment_link_analytics AS
SELECT 
  pl.id,
  pl.link_code,
  pl.email,
  pl.metadata,
  pl.created_at,
  pl.used_count,
  pl.last_used_at,
  pl.is_active,
  p.name as product_name,
  p.price as product_price,
  p.price_usd as product_price_usd,
  m.name as merchant_name,
  m.email as merchant_email,
  COUNT(pi.id) as total_payments,
  SUM(CASE WHEN pi.status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
  SUM(CASE WHEN pi.status = 'succeeded' THEN pi.amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN pi.status = 'succeeded' THEN pi.amount_usd ELSE 0 END) as total_revenue_usd
FROM payment_links pl
LEFT JOIN products p ON pl.product_id = p.id
LEFT JOIN merchants m ON pl.merchant_id = m.id
LEFT JOIN payment_intents pi ON pi.source_link_id = pl.id
GROUP BY pl.id, p.name, p.price, p.price_usd, m.name, m.email;

-- =====================================================
-- OPTIONAL: Function to update link usage count
-- =====================================================
CREATE OR REPLACE FUNCTION update_payment_link_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_link_id IS NOT NULL THEN
    UPDATE payment_links 
    SET 
      used_count = used_count + 1,
      last_used_at = NOW()
    WHERE id = NEW.source_link_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update usage count
DROP TRIGGER IF EXISTS payment_link_usage_trigger ON payment_intents;
CREATE TRIGGER payment_link_usage_trigger
AFTER INSERT ON payment_intents
FOR EACH ROW
EXECUTE FUNCTION update_payment_link_usage();

-- =====================================================
-- OPTIONAL: Function to check if payment link is valid
-- =====================================================
CREATE OR REPLACE FUNCTION is_payment_link_valid(link_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT * INTO link_record 
  FROM payment_links 
  WHERE id = link_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF link_record.is_active = FALSE THEN
    RETURN FALSE;
  END IF;
  
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant permissions (adjust based on your database users)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE ON payment_links TO your_app_user;
-- GRANT SELECT ON payment_link_analytics TO your_app_user;

-- =====================================================
-- Sample queries to verify the setup
-- =====================================================
-- Check if tables and indexes were created successfully:
-- SELECT tablename FROM pg_tables WHERE tablename = 'payment_links';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'payment_links';

-- View payment link analytics:
-- SELECT * FROM payment_link_analytics WHERE merchant_id = 'your-merchant-id';

-- Find payment intents created from a specific link:
-- SELECT * FROM payment_intents WHERE source_link_id = 'your-link-id';

-- Get the most used payment links:
-- SELECT link_code, email, used_count, last_used_at 
-- FROM payment_links 
-- ORDER BY used_count DESC 
-- LIMIT 10;