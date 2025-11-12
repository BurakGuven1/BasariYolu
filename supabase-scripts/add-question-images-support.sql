-- ============================================
-- ADD IMAGE SUPPORT TO QUESTIONS TABLE
-- ============================================
-- This script adds support for question images (graphs, figures, formulas, etc.)

-- STEP 1: Add columns to questions table
-- ============================================

-- Add page_number column to track which PDF page the question came from
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS page_number INTEGER,
ADD COLUMN IF NOT EXISTS page_image_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN questions.page_number IS 'PDF page number where this question appears (for reference)';
COMMENT ON COLUMN questions.page_image_url IS 'URL to the image of the PDF page containing this question (includes visuals, graphs, formulas)';


-- STEP 2: Create storage bucket for question images
-- ============================================
-- Note: This might need to be done via Supabase Dashboard if you don't have admin access via SQL

-- In Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket named: 'question-images'
-- 3. Make it PUBLIC
-- 4. Set file size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/png


-- STEP 3: Set up RLS (Row Level Security) policies for storage
-- ============================================

-- Allow institutions to upload images
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Institutions can upload question images',
  'question-images',
  '(auth.role() = ''authenticated'')'
) ON CONFLICT DO NOTHING;

-- Allow public read access to images
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public can view question images',
  'question-images',
  'true'
) ON CONFLICT DO NOTHING;


-- STEP 4: Create index for faster queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_page_number ON questions(page_number);
CREATE INDEX IF NOT EXISTS idx_questions_owner_page ON questions(owner_id, page_number);


-- STEP 5: Verify changes
-- ============================================

-- Check if columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name IN ('page_number', 'page_image_url');

-- Check existing questions count
SELECT
  COUNT(*) as total_questions,
  COUNT(page_image_url) as questions_with_images,
  COUNT(*) - COUNT(page_image_url) as questions_without_images
FROM questions;


-- STEP 6: Sample query to view questions with images
-- ============================================

SELECT
  id,
  subject,
  topic,
  question_text,
  page_number,
  page_image_url,
  created_at
FROM questions
WHERE page_image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;


-- NOTES:
-- ============================================
-- 1. Existing questions will have NULL for page_number and page_image_url
-- 2. New questions uploaded from PDF with image extraction will have these fields populated
-- 3. Images are stored in Supabase Storage bucket 'question-images'
-- 4. Image URLs are public and can be accessed directly
-- 5. File naming convention: {institution_id}/q{question_num}_p{page_num}_{timestamp}.jpg
