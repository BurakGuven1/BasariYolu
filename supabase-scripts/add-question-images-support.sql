-- ============================================
-- ADD IMAGE SUPPORT TO QUESTIONS TABLE
-- ============================================
-- This script adds support for question images (graphs, figures, formulas, etc.)

-- STEP 1: Add columns to questions table
-- ============================================

-- Add page_number column to track which PDF page the question came from
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS page_number INTEGER;

-- Add page_image_url column to store the image URL
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS page_image_url TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN questions.page_number IS 'PDF page number where this question appears (for reference)';
COMMENT ON COLUMN questions.page_image_url IS 'URL to the image of the PDF page containing this question (includes visuals, graphs, formulas)';


-- STEP 2: Create indexes for faster queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_page_number ON questions(page_number);
CREATE INDEX IF NOT EXISTS idx_questions_owner_page ON questions(owner_id, page_number);


-- STEP 3: Verify changes
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


-- STEP 4: Sample query to view questions with images
-- ============================================

SELECT
  id,
  subject,
  topic,
  content->>'stem' as question_text,
  page_number,
  page_image_url,
  created_at
FROM questions
WHERE page_image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- NOTES AND NEXT STEPS:
-- ============================================
-- 1. Tablo kolonları başarıyla eklendi
-- 2. Storage bucket'ı Dashboard'dan manuel oluşturmanız gerekiyor
-- 3. Aşağıdaki adımları takip edin:

/*
STORAGE BUCKET OLUŞTURMA (Supabase Dashboard):
==============================================

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden "Storage" seçin
4. "Create a new bucket" butonuna tıklayın
5. Bucket ayarları:
   - Name: question-images
   - Public bucket: ✓ (işaretleyin - public olmalı)
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png
6. "Create bucket" butonuna tıklayın

BUCKET POLİCY AYARLARI:
========================

Bucket oluşturduktan sonra:
1. "question-images" bucket'ına tıklayın
2. "Policies" sekmesine gidin
3. "New Policy" butonuna tıklayın
4. "For full customization" seçeneğini seçin

Policy 1 - Public Read (herkes okuyabilir):
- Policy name: Public read access
- Allowed operation: SELECT
- Target roles: public (veya boş bırakın)
- USING expression: true
- "Save policy" butonuna tıklayın

Policy 2 - Authenticated Upload (giriş yapanlar yükleyebilir):
- Policy name: Authenticated upload
- Allowed operation: INSERT
- Target roles: authenticated
- USING expression: true
- "Save policy" butonuna tıklayın

Policy 3 - Authenticated Update (giriş yapanlar güncelleyebilir):
- Policy name: Authenticated update
- Allowed operation: UPDATE
- Target roles: authenticated
- USING expression: true
- "Save policy" butonuna tıklayın

Policy 4 - Authenticated Delete (giriş yapanlar silebilir):
- Policy name: Authenticated delete
- Allowed operation: DELETE
- Target roles: authenticated
- USING expression: true
- "Save policy" butonuna tıklayın

TAMAMLANDI!
===========
Artık sistem görsel desteğine hazır.
*/

