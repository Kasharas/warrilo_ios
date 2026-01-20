-- 1. Enable RLS on the devices table (if not already enabled)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (clean slate)
DROP POLICY IF EXISTS "Users can manage their own devices" ON devices;
DROP POLICY IF EXISTS "Enable read access for own devices" ON devices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON devices;
DROP POLICY IF EXISTS "Enable update for own devices" ON devices;
DROP POLICY IF EXISTS "Enable delete for own devices" ON devices;

-- 3. Create a comprehensive policy for ALL operations (Select, Insert, Update, Delete)
-- This allows a user to do ANYTHING to a row where user_id matches their Auth ID.
CREATE POLICY "Users can manage their own devices"
ON devices
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Verify Storage Policies (Optional but recommended)
-- Ensure 'device-photos' bucket exists and has similar policies

-- ALLOW INSERT
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'device-photos' AND (storage.foldername(name))[1] = auth.uid()::text );

-- ALLOW SELECT (Public Access usually enabled in bucket settings, but this enforces auth)
CREATE POLICY "Allow users to view own photos"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'device-photos' AND (storage.foldername(name))[1] = auth.uid()::text );
