-- Soru Portalı'na sınıf bazlı kategorilendirme ekle
-- Migration: student_questions tablosuna grade_level kolonu

-- 1. Grade level kolonu ekle
ALTER TABLE student_questions
ADD COLUMN IF NOT EXISTS grade_level TEXT NOT NULL DEFAULT '5';

-- 2. Grade level constraint ekle (sadece geçerli değerler)
ALTER TABLE student_questions
DROP CONSTRAINT IF EXISTS valid_grade_level;

ALTER TABLE student_questions
ADD CONSTRAINT valid_grade_level
CHECK (grade_level IN ('5', '6', '7', '8', '9', '10', '11', '12', 'LGS', 'TYT', 'AYT'));

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_student_questions_grade_level
ON student_questions(grade_level);

-- 4. Mevcut kayıtları güncelle (varsa)
-- Varsayılan olarak '9' (orta düzey) yapalım
UPDATE student_questions
SET grade_level = '9'
WHERE grade_level IS NULL;

-- 5. Kontrol et
SELECT
  grade_level,
  COUNT(*) as question_count
FROM student_questions
GROUP BY grade_level
ORDER BY
  CASE
    WHEN grade_level ~ '^\d+$' THEN grade_level::integer
    WHEN grade_level = 'LGS' THEN 8
    WHEN grade_level = 'TYT' THEN 11
    WHEN grade_level = 'AYT' THEN 12
    ELSE 99
  END;

SELECT 'Grade level kolonu başarıyla eklendi!' as message;
