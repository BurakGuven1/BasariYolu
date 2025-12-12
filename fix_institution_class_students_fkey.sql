-- Fix institution_class_students foreign key constraint
-- The constraint was pointing to students.id but code uses profiles.id (user_id)

-- 1. Drop existing incorrect foreign key constraint
ALTER TABLE institution_class_students
DROP CONSTRAINT IF EXISTS institution_class_students_student_id_fkey;

-- 2. Add correct foreign key constraint (pointing to profiles.id)
ALTER TABLE institution_class_students
ADD CONSTRAINT institution_class_students_student_id_fkey
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Verify the fix
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'institution_class_students'
AND tc.constraint_type = 'FOREIGN KEY';
