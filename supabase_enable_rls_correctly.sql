-- Supabase SQL Editor'da çalıştır
-- RLS'i DOĞRU policy'lerle aktif et

-- 1. Önce tabloları yeniden oluştur (foreign key'lerle birlikte)
DROP TABLE IF EXISTS answer_likes CASCADE;
DROP TABLE IF EXISTS question_likes CASCADE;
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS student_questions CASCADE;

CREATE TABLE student_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  image_url TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, student_id)
);

CREATE TABLE answer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, student_id)
);

-- 2. Indexler
CREATE INDEX idx_student_questions_student_id ON student_questions(student_id);
CREATE INDEX idx_student_questions_created_at ON student_questions(created_at DESC);
CREATE INDEX idx_student_answers_question_id ON student_answers(question_id);
CREATE INDEX idx_student_answers_student_id ON student_answers(student_id);
CREATE INDEX idx_question_likes_question_id ON question_likes(question_id);
CREATE INDEX idx_answer_likes_answer_id ON answer_likes(answer_id);

-- 3. RLS'i Aktif Et
ALTER TABLE student_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_likes ENABLE ROW LEVEL SECURITY;

-- 4. DOĞRU Policy'ler - Authenticated kullanıcılar her şeyi yapabilir
CREATE POLICY "authenticated_all_student_questions"
  ON student_questions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_student_answers"
  ON student_answers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_question_likes"
  ON question_likes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all_answer_likes"
  ON answer_likes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- 6. TEST
INSERT INTO student_questions (student_id, title, description)
VALUES (
  auth.uid(),  -- Şu anki kullanıcı
  'Test Sorusu',
  'Bu bir test - başarılıysa silinecek'
);

-- Başarılı olduysa sil
DELETE FROM student_questions WHERE title = 'Test Sorusu';

-- 7. Kontrol
SELECT
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('student_questions', 'student_answers', 'question_likes', 'answer_likes')
  AND schemaname = 'public';

-- rowsecurity = true ve policy_count = 1 olmalı
SELECT 'SUCCESS! RLS doğru şekilde aktif!' as message;
