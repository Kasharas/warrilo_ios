# Database Migration Instructions

## Step 1: Update Supabase Database Schema

### Prerequisites
- Access to your Supabase project dashboard
- Admin privileges or ability to run SQL migrations

### Migration File
- **File**: `001_update_devices_schema.sql`
- **Purpose**: Update devices table with required constraints and optional columns

### Execution Steps

#### 1. Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `bykxbhibrfgrdjnvtlaj`

#### 2. Navigate to SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"** to create a new SQL query

#### 3. Execute the Migration
1. Copy the entire contents of `001_update_devices_schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button to execute the migration

#### 4. Verify the Migration
1. After execution, check the **"Results"** tab
2. You should see the table structure with all columns and constraints
3. Verify that:
   - Required columns show `NO` in `is_nullable` column
   - Optional columns show `YES` in `is_nullable` column
   - All comments are properly displayed

#### 5. Check for Errors
1. Look at the **"Logs"** tab for any error messages
2. If errors occur, they will be displayed in red
3. Common issues and solutions:
   - **Column doesn't exist**: The column may need to be created first
   - **Constraint already exists**: This is normal, the migration uses `IF NOT EXISTS`
   - **Permission denied**: Ensure you have admin privileges

### Expected Results

After successful execution, you should see:

#### Table Structure
- `name` - NOT NULL (required)
- `purchase_date` - NOT NULL (required) 
- `warranty_months` - NOT NULL (required)
- `invoice_url` - NOT NULL (required)
- `serial_number` - NULLABLE (optional)
- `supplier` - NULLABLE (optional)

#### Constraints Added
- `check_warranty_months_positive` - Ensures warranty months > 0
- `check_purchase_date_not_future` - Ensures purchase date ≤ today

#### Indexes Created
- `idx_devices_user_id` - For user-specific queries
- `idx_devices_purchase_date` - For date-based queries
- `idx_devices_warranty_months` - For warranty queries

### Rollback Instructions (if needed)

If you need to rollback the migration:

```sql
-- Remove constraints
ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_warranty_months_positive;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_purchase_date_not_future;

-- Remove indexes
DROP INDEX IF EXISTS idx_devices_user_id;
DROP INDEX IF EXISTS idx_devices_purchase_date;
DROP INDEX IF EXISTS idx_devices_warranty_months;

-- Make columns nullable again (if needed)
ALTER TABLE devices 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN purchase_date DROP NOT NULL,
ALTER COLUMN warranty_months DROP NOT NULL,
ALTER COLUMN invoice_url DROP NOT NULL;
```

### Next Steps
After successful migration:
1. Test the constraints by trying to insert invalid data
2. Verify that required fields are enforced
3. Proceed to Step 2 of the synchronization implementation

### Support
If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify your database permissions
3. Ensure the devices table exists before running the migration
