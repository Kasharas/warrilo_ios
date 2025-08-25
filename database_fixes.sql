-- Warrilo App - Database Schema Fixes
-- Run these commands in your Supabase SQL Editor to fix the current issues

-- Add missing columns to devices table
-- This fixes the "Could not find column" errors

ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS receipt_image_url TEXT,
ADD COLUMN IF NOT EXISTS warranty_duration INTEGER,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS supabase_device_image_url TEXT,
ADD COLUMN IF NOT EXISTS supabase_receipt_image_url TEXT;

-- Update existing devices table structure to match what the code expects
-- The code uses these column names:
-- - image_url (already exists)
-- - receipt_image_url (newly added)
-- - warranty_duration (newly added) 
-- - warranty_expiry (newly added)
-- - supabase_device_image_url (newly added)
-- - supabase_receipt_image_url (newly added)

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- 2. Rename 'store' column to 'store_name' if it exists (for consistency)
-- Note: The database already has 'store_name', so this is just for reference

-- 3. Add comments to clarify column purposes
COMMENT ON COLUMN devices.image_url IS 'URL to device photo stored in Supabase Storage';
COMMENT ON COLUMN devices.receipt_image_url IS 'URL to receipt photo stored in Supabase Storage';
COMMENT ON COLUMN devices.warranty_duration IS 'Warranty duration in months';
COMMENT ON COLUMN devices.warranty_expiry IS 'Date when warranty expires';

-- 4. Verify the updated devices table structure
-- You can run this to see the final structure:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'devices' 
-- ORDER BY ordinal_position;

-- 5. Optional: Create a view for easier device management
CREATE OR REPLACE VIEW device_summary AS
SELECT 
  d.id,
  d.name,
  d.brand,
  d.category,
  d.purchase_date,
  d.purchase_price,
  d.store_name,
  d.warranty_duration,
  d.warranty_expiry,
  d.image_url,
  d.receipt_image_url,
  d.created_at,
  u.email as user_email
FROM devices d
JOIN user_profiles u ON d.user_id = u.id;

-- 6. Grant permissions on the view
GRANT SELECT ON device_summary TO authenticated;

-- Note: After running these commands, the devices table will have all the columns
-- that the application code is trying to insert, resolving the "column not found" errors.

