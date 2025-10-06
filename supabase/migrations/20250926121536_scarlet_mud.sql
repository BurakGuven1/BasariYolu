/*
  # Update exam results structure for Turkish education system

  1. Changes
    - Remove old score columns (mathematics_score, science_score, etc.)
    - Add exam_details column to store detailed exam data as JSON
    - Keep total_score for overall performance tracking
    - Update existing data structure

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Add new column for detailed exam data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'exam_details'
  ) THEN
    ALTER TABLE exam_results ADD COLUMN exam_details jsonb;
  END IF;
END $$;

-- Remove old score columns if they exist
DO $$
BEGIN
  -- Remove mathematics_score column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'mathematics_score'
  ) THEN
    ALTER TABLE exam_results DROP COLUMN mathematics_score;
  END IF;

  -- Remove science_score column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'science_score'
  ) THEN
    ALTER TABLE exam_results DROP COLUMN science_score;
  END IF;

  -- Remove turkish_score column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'turkish_score'
  ) THEN
    ALTER TABLE exam_results DROP COLUMN turkish_score;
  END IF;

  -- Remove social_studies_score column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'social_studies_score'
  ) THEN
    ALTER TABLE exam_results DROP COLUMN social_studies_score;
  END IF;

  -- Remove english_score column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_results' AND column_name = 'english_score'
  ) THEN
    ALTER TABLE exam_results DROP COLUMN english_score;
  END IF;
END $$;