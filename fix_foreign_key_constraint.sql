-- FINAL FIX: Foreign key constraint hatası çözümü
-- Problem: user_id profiles tablosunda henüz yok, trigger gecikmeli
-- Solution: Foreign key'i auth.users'a değiştir + duplicate policy'leri temizle

-- STEP 1: Clean up duplicate policies
DROP POLICY IF EXISTS "Institution staff manage student requests" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "Students can insert own request" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "Students can view own requests" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_delete_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_insert_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_select_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_update_policy" ON institution_student_requests CASCADE;

-- STEP 2: Drop old foreign key constraint
ALTER TABLE institution_student_requests
  DROP CONSTRAINT IF EXISTS institution_student_requests_user_id_fkey CASCADE;

ALTER TABLE institution_student_requests
  DROP CONSTRAINT IF EXISTS institution_student_requests_user_id_fkey1 CASCADE;

-- STEP 3: Add new foreign key to auth.users (not profiles)
-- auth.users is created immediately, profiles trigger can be delayed
ALTER TABLE institution_student_requests
  ADD CONSTRAINT institution_student_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- STEP 4: Enable RLS
ALTER TABLE institution_student_requests ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create clean policies

-- INSERT: Allow anon + authenticated (for email confirmation flow)
CREATE POLICY "allow_insert_student_requests"
  ON institution_student_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT: Users see own, admins see all
CREATE POLICY "allow_select_student_requests"
  ON institution_student_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_student_requests.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  );

-- UPDATE: Only admins
CREATE POLICY "allow_update_student_requests"
  ON institution_student_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_student_requests.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_student_requests.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  );

-- DELETE: Only admins
CREATE POLICY "allow_delete_student_requests"
  ON institution_student_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_student_requests.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  );

-- STEP 6: Verify
SELECT
  'Policies' as type,
  policyname as name,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'institution_student_requests'
ORDER BY policyname

UNION ALL

SELECT
  'Foreign Keys' as type,
  conname as name,
  'N/A' as cmd,
  ARRAY[confrelid::regclass::text] as roles
FROM pg_constraint
WHERE conrelid = 'institution_student_requests'::regclass
AND contype = 'f';

-- Should see:
-- 4 policies (allow_insert, allow_select, allow_update, allow_delete)
-- 1 foreign key pointing to auth.users
