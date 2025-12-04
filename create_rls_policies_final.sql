-- STEP 2: Create new policies (run this AFTER cleanup_rls_policies.sql)

-- Ensure RLS is enabled
ALTER TABLE institution_student_requests ENABLE ROW LEVEL SECURITY;

-- INSERT policy: Allow authenticated AND anonymous users
-- Çünkü email confirmation açıkken yeni user'ın session'ı yok
CREATE POLICY "institution_student_requests_insert_policy"
  ON institution_student_requests
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

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

-- Verify policies were created
SELECT
  policyname,
  cmd,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN 'USING defined'
    ELSE 'No USING'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK defined'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'institution_student_requests'
ORDER BY policyname;
