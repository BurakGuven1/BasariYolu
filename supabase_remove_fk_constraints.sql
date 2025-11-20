-- Supabase SQL Editor'da çalıştır
-- Foreign key constraint'leri kaldır (auth.users RLS'i bypass et)

-- 1. Önce mevcut constraint isimlerini bul
SELECT
    con.conname AS constraint_name,
    con.conrelid::regclass AS table_name,
    att.attname AS column_name,
    referenced.relname AS referenced_table
FROM pg_constraint con
JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
JOIN pg_class referenced ON referenced.oid = con.confrelid
WHERE con.contype = 'f'
  AND con.conrelid::regclass::text IN ('student_questions', 'student_answers', 'question_likes', 'answer_likes');

-- 2. Tabloları yeniden oluştur - foreign key olmadan
DROP TABLE IF EXISTS answer_likes CASCADE;
DROP TABLE IF EXISTS question_likes CASCADE;
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS student_questions CASCADE;

-- 3. Foreign key OLMADAN oluştur
CREATE TABLE student_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,  -- auth.users foreign key YOK
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  is_solved BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,  -- auth.users foreign key YOK
  answer_text TEXT NOT NULL,
  image_url TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,  -- auth.users foreign key YOK
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, student_id)
);

CREATE TABLE answer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,  -- auth.users foreign key YOK
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, student_id)
);

-- 4. Indexler
CREATE INDEX idx_student_questions_student_id ON student_questions(student_id);
CREATE INDEX idx_student_questions_created_at ON student_questions(created_at DESC);
CREATE INDEX idx_student_answers_question_id ON student_answers(question_id);
CREATE INDEX idx_student_answers_student_id ON student_answers(student_id);
CREATE INDEX idx_question_likes_question_id ON question_likes(question_id);
CREATE INDEX idx_question_likes_student_id ON question_likes(student_id);
CREATE INDEX idx_answer_likes_answer_id ON answer_likes(answer_id);
CREATE INDEX idx_answer_likes_student_id ON answer_likes(student_id);

-- 5. Fonksiyonlar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_questions_updated_at
  BEFORE UPDATE ON student_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at
  BEFORE UPDATE ON student_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_question_view_count(question_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE student_questions
  SET view_count = view_count + 1
  WHERE id = question_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TEST: Bir soru ekle
INSERT INTO student_questions (student_id, title, description)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),  -- Herhangi bir user
  'Test Sorusu',
  'Bu bir test'
);

-- Başarılı olduysa DELETE et
DELETE FROM student_questions WHERE title = 'Test Sorusu';

SELECT 'SUCCESS! Artık soru ekleyebilirsin!' as message;
