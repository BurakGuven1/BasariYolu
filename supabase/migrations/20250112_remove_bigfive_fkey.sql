-- Remove Foreign Key Constraints from Big Five Tables
-- Fix 409 Conflict error: student_id constraint points to wrong table

-- Drop foreign key constraints
ALTER TABLE big_five_responses DROP CONSTRAINT IF EXISTS big_five_responses_student_id_fkey;
ALTER TABLE big_five_results DROP CONSTRAINT IF EXISTS big_five_results_student_id_fkey;

-- Remove NOT NULL constraint if it exists (to be safe)
ALTER TABLE big_five_responses ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE big_five_results ALTER COLUMN student_id DROP NOT NULL;

-- Make sure the columns exist and are correct type
ALTER TABLE big_five_responses ALTER COLUMN student_id TYPE uuid USING student_id::uuid;
ALTER TABLE big_five_results ALTER COLUMN student_id TYPE uuid USING student_id::uuid;

-- Add back NOT NULL after fixing type
ALTER TABLE big_five_responses ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE big_five_results ALTER COLUMN student_id SET NOT NULL;
