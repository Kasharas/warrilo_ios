# Database Setup Instructions

## Current Issue
The application is failing because the database schema doesn't match what the code expects. The error shows:
```
"Could not find the 'supabase_device_image_url' column of 'devices' in the schema cache"
```

## Solution
You need to run the SQL commands in `database_fixes.sql` in your Supabase SQL Editor.

## Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `pkvlvawtfxdmbddjqdgi`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Fix Script**
   - Copy the contents of `database_fixes.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify the Changes**
   - The script will show you the updated table structure
   - You should see the new columns added to the `devices` table

## What the Script Does
- Adds `receipt_image_url` column (TEXT)
- Adds `warranty_duration` column (INTEGER) 
- Adds `warranty_expiry` column (DATE)
- Adds `supabase_device_image_url` column (TEXT)
- Adds `supabase_receipt_image_url` column (TEXT)

## After Running the Script
- The application should work without database errors
- Images will be stored locally for immediate display
- Supabase Storage will be used as backup (when working)

## Alternative: Simplified Approach
If you want to avoid the Supabase URL columns entirely, you can run this simpler version:
```sql
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS receipt_image_url TEXT,
ADD COLUMN IF NOT EXISTS warranty_duration INTEGER,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
```

This will add only the essential columns needed for the app to function.

