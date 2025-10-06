/*
  # Add invite_code column to students table

  1. Changes
    - Add `invite_code` column to `students` table
    - Set it as unique to ensure each student has a distinct code
    - Add a function to generate random invite codes
    - Set default value to auto-generate codes for new students
    - Update existing students with unique invite codes

  2. Security
    - No RLS changes needed as existing policies will apply
*/

-- Function to generate random invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Add invite_code column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE students ADD COLUMN invite_code TEXT UNIQUE DEFAULT generate_invite_code();
  END IF;
END $$;

-- Update existing students with unique invite codes if they don't have one
UPDATE students 
SET invite_code = generate_invite_code() 
WHERE invite_code IS NULL;

-- Make sure invite_code is not null for future inserts
ALTER TABLE students ALTER COLUMN invite_code SET NOT NULL;