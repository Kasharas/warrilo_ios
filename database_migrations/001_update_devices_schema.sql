-- Migration: Update Devices Table Schema
-- Description: Add required constraints and optional columns for simplified device management
-- Date: 2025-01-XX
-- Author: Warrilo App

-- Step 1: Ensure required columns exist and are properly constrained
ALTER TABLE devices 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN purchase_date SET NOT NULL,
ALTER COLUMN warranty_months SET NOT NULL,
ALTER COLUMN invoice_url SET NOT NULL;

-- Step 2: Ensure optional columns exist (but nullable)
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS supplier text;

-- Step 3: Update comments for clarity
COMMENT ON COLUMN devices.name IS 'Device name (required)';
COMMENT ON COLUMN devices.purchase_date IS 'Purchase date (required)';
COMMENT ON COLUMN devices.warranty_months IS 'Warranty duration in months (required)';
COMMENT ON COLUMN devices.invoice_url IS 'Receipt/invoice URL (required)';
COMMENT ON COLUMN devices.supplier IS 'Store/retailer where purchased (optional)';
COMMENT ON COLUMN devices.serial_number IS 'Device serial number (optional)';

-- Step 4: Add validation constraints
-- Ensure warranty_months is positive
ALTER TABLE devices 
ADD CONSTRAINT check_warranty_months_positive 
CHECK (warranty_months > 0);

-- Ensure purchase_date is not in the future
ALTER TABLE devices 
ADD CONSTRAINT check_purchase_date_not_future 
CHECK (purchase_date <= CURRENT_DATE);

-- Step 5: Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_purchase_date ON devices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_devices_warranty_months ON devices(warranty_months);

-- Step 6: Verify the migration
-- This will show the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    col_description(table_name::regclass, ordinal_position) as comment
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;
