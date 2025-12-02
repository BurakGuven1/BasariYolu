-- STEP 1: Clean up existing policies (run this FIRST)

-- Drop ALL existing policies on institution_student_requests
DROP POLICY IF EXISTS "institution_student_requests_insert_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_select_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_update_policy" ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS "institution_student_requests_delete_policy" ON institution_student_requests CASCADE;

-- Also try without quotes in case they exist with different names
DROP POLICY IF EXISTS institution_student_requests_insert_policy ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS institution_student_requests_select_policy ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS institution_student_requests_update_policy ON institution_student_requests CASCADE;
DROP POLICY IF EXISTS institution_student_requests_delete_policy ON institution_student_requests CASCADE;

-- Check if any policies still exist
SELECT policyname FROM pg_policies WHERE tablename = 'institution_student_requests';

-- If still exist, drop them manually:
-- Run this query to see ALL existing policy names:
SELECT
  'DROP POLICY "' || policyname || '" ON ' || tablename || ';' as drop_command
FROM pg_policies
WHERE tablename = 'institution_student_requests';

-- Copy the output commands and run them one by one if needed
