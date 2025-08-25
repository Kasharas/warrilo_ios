# Warrilo App - Complete Database Schema

## 📊 **Database Overview**
- **Project URL**: https://pkvlvawtfxdmbddjqdgi.supabase.co
- **Total Tables**: 8
- **RLS Status**: All tables have Row Level Security enabled
- **Current State**: All tables are empty (no data yet)

---

## 🗂️ **Table Details**

### **1. `user_profiles` Table**
**Purpose**: Stores user account information and subscription details
**Columns**:
- `id` (UUID, PK) - References auth.users(id)
- `email` (TEXT, UNIQUE, NOT NULL)
- `full_name` (TEXT)
- `phone` (TEXT)
- `avatar_url` (TEXT)
- `is_pro_user` (BOOLEAN, DEFAULT FALSE)
- `subscription_tier` (TEXT, DEFAULT 'free')
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own profile

---

### **2. `devices` Table**
**Purpose**: Stores device information and details
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `name` (TEXT, NOT NULL)
- `brand` (TEXT)
- `model` (TEXT)
- `category` (TEXT, NOT NULL)
- `serial_number` (TEXT)
- `purchase_date` (DATE)
- `purchase_price` (DECIMAL(10,2))
- `store_name` (TEXT)
- `notes` (TEXT)
- `image_url` (TEXT) ⚠️ **NOTE**: This is the correct column name
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own devices

---

### **3. `warranties` Table**
**Purpose**: Stores warranty information for devices
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `device_id` (UUID, FK to devices.id, NOT NULL)
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `warranty_type` (TEXT, NOT NULL) - 'manufacturer', 'extended', 'store'
- `provider_name` (TEXT, NOT NULL)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `duration_months` (INTEGER)
- `coverage_details` (TEXT)
- `terms_conditions` (TEXT)
- `contact_info` (TEXT)
- `policy_number` (TEXT)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access warranties for their devices

---

### **4. `receipts` Table**
**Purpose**: Stores receipt information and images
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `device_id` (UUID, FK to devices.id)
- `store_name` (TEXT, NOT NULL)
- `purchase_date` (DATE, NOT NULL)
- `total_amount` (DECIMAL(10,2), NOT NULL)
- `receipt_number` (TEXT)
- `image_url` (TEXT) ⚠️ **NOTE**: This is the correct column name
- `ocr_data` (JSONB) - Extracted text from receipt image
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own receipts

---

### **5. `alerts` Table**
**Purpose**: Stores warranty expiration alerts and reminders
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `warranty_id` (UUID, FK to warranties.id, NOT NULL)
- `device_id` (UUID, FK to devices.id, NOT NULL)
- `alert_type` (TEXT, NOT NULL) - 'expiring_soon', 'expired', 'renewal_reminder'
- `message` (TEXT, NOT NULL)
- `scheduled_date` (DATE, NOT NULL)
- `is_sent` (BOOLEAN, DEFAULT FALSE)
- `sent_at` (TIMESTAMPTZ)
- `is_read` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own alerts

---

### **6. `family_members` Table**
**Purpose**: Stores family member information for PRO users
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `name` (TEXT, NOT NULL)
- `email` (TEXT)
- `relationship` (TEXT)
- `can_view` (BOOLEAN, DEFAULT TRUE)
- `can_edit` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own family members

---

### **7. `shared_warranties` Table**
**Purpose**: Manages warranty sharing between family members
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `warranty_id` (UUID, FK to warranties.id, NOT NULL)
- `family_member_id` (UUID, FK to family_members.id, NOT NULL)
- `permissions` (TEXT[], DEFAULT ARRAY['view']) - 'view', 'edit', 'delete'
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access shared warranties they're part of

---

### **8. `notifications` Table**
**Purpose**: Stores system notifications and messages
**Columns**:
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to user_profiles.id, NOT NULL)
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `type` (TEXT, NOT NULL) - 'warranty', 'system', 'promotion'
- `is_read` (BOOLEAN, DEFAULT FALSE)
- `action_url` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**RLS Policies**: Users can only access their own notifications

---

## 🔐 **Security Features**
- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Foreign Key Constraints**: Proper referential integrity
- **Automatic Triggers**: User profile creation on signup

---

## 📝 **Current Issues Identified**
1. **Column Name Mismatch**: Code uses `device_image_url` but database has `image_url`
2. **Missing Column**: Code tries to insert `receipt_image_url` but this column doesn't exist in `devices` table
3. **Missing Column**: Code tries to insert `warranty_duration` but this column doesn't exist in `devices` table
4. **Missing Column**: Code tries to insert `warranty_expiry` but this column doesn't exist in `devices` table
5. **Missing Column**: Code tries to insert `store` but database has `store_name`

---

## 🛠️ **Required Fixes**
1. **Update Code**: Change `device_image_url` to `image_url`
2. **Add Missing Columns**: Add `receipt_image_url`, `warranty_duration`, `warranty_expiry` to `devices` table
3. **Fix Column Names**: Change `store` to `store_name`
4. **Implement Image Upload**: Use Supabase Storage for actual file uploads

---

## 📊 **Indexes for Performance**
- `idx_devices_user_id` on devices(user_id)
- `idx_warranties_device_id` on warranties(device_id)
- `idx_warranties_user_id` on warranties(user_id)
- `idx_warranties_end_date` on warranties(end_date)
- `idx_alerts_user_id` on alerts(user_id)
- `idx_alerts_scheduled_date` on alerts(scheduled_date)
- `idx_receipts_user_id` on receipts(user_id)
- `idx_receipts_device_id` on receipts(device_id)

---

*Last Updated: Current Session*
*Schema Source: database_setup.sql*

