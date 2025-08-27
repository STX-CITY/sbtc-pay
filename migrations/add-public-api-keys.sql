-- Add public API key columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS public_api_key_live VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS public_api_key_test VARCHAR(255) UNIQUE;

-- Generate public API keys for existing merchants (if any)
-- Note: These are placeholder values - in production you'd generate proper unique keys
UPDATE merchants 
SET 
  public_api_key_live = CASE 
    WHEN api_key_live IS NOT NULL THEN 'pk_live_' || encode(gen_random_bytes(24), 'base64')
    ELSE NULL
  END,
  public_api_key_test = CASE 
    WHEN api_key_test IS NOT NULL THEN 'pk_test_' || encode(gen_random_bytes(24), 'base64')
    ELSE NULL
  END
WHERE public_api_key_live IS NULL OR public_api_key_test IS NULL;