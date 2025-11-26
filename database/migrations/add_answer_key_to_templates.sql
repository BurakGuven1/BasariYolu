-- Add answer_key field to institution_external_exam_templates
-- This allows teachers to enter the correct answers once, then system auto-compares student answers

-- Add answer_key column (JSONB mapping question number to correct answer)
-- Format: {"1": "A", "2": "D", "3": "B", "4": "C", "5": "E", ...}
ALTER TABLE institution_external_exam_templates
ADD COLUMN IF NOT EXISTS answer_key JSONB DEFAULT '{}';

-- Add comment explaining the answer_key format
COMMENT ON COLUMN institution_external_exam_templates.answer_key IS 'Cevap anahtarı - {questionNumber: correctAnswer} formatında. Örnek: {"1": "A", "2": "D", "3": "B"}. Öğrenci cevapları ile karşılaştırılarak otomatik D/Y/B hesaplanır.';

-- Update comment for answers column in results table to reflect new format
COMMENT ON COLUMN institution_external_exam_results.answers IS 'Öğrenci cevapları - {questionNumber: {studentAnswer: "A", isCorrect: true}} formatında. studentAnswer: A/B/C/D/E/X (X=boş)';
