-- FIX: Institution student signup RLS policy
-- Problem: New student signups fail with "new row violates row-level security policy"
-- Solution: Allow authenticated users to INSERT their own student request

-- Drop existing policies if any
DROP POLICY IF EXISTS "institution_student_requests_insert_policy" ON institution_student_requests;
DROP POLICY IF EXISTS "institution_student_requests_select_policy" ON institution_student_requests;
DROP POLICY IF EXISTS "institution_student_requests_update_policy" ON institution_student_requests;
DROP POLICY IF EXISTS "institution_student_requests_delete_policy" ON institution_student_requests;

-- Enable RLS
ALTER TABLE institution_student_requests ENABLE ROW LEVEL SECURITY;

-- INSERT policy: Allow authenticated users to insert their own requests
CREATE POLICY "institution_student_requests_insert_policy"
  ON institution_student_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- SELECT policy: Users can see their own requests, institution admins can see all
CREATE POLICY "institution_student_requests_select_policy"
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

-- UPDATE policy: Only institution admins can update (approve/reject)
CREATE POLICY "institution_student_requests_update_policy"
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

-- DELETE policy: Only institution admins can delete
CREATE POLICY "institution_student_requests_delete_policy"
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

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'institution_student_requests'
ORDER BY policyname;
