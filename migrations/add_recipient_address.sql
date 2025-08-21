-- Add recipient_address column to merchants table
ALTER TABLE merchants 
ADD COLUMN recipient_address VARCHAR(255);

-- Set default recipient_address to stacks_address for existing merchants
UPDATE merchants 
SET recipient_address = stacks_address 
WHERE recipient_address IS NULL;