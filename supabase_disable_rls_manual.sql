-- Bu scripti Supabase Dashboard > SQL Editor'da çalıştır
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. RLS'i tamamen kapat
ALTER TABLE student_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_likes DISABLE ROW LEVEL SECURITY;

-- 2. Tüm mevcut policy'leri sil
DROP POLICY IF EXISTS "Anyone can view questions" ON student_questions;
DROP POLICY IF EXISTS "Students can create questions" ON student_questions;
DROP POLICY IF EXISTS "Students can update their own questions" ON student_questions;
DROP POLICY IF EXISTS "Students can delete their own questions" ON student_questions;

DROP POLICY IF EXISTS "Anyone can view answers" ON student_answers;
DROP POLICY IF EXISTS "Students can create answers" ON student_answers;
DROP POLICY IF EXISTS "Students can update their own answers" ON student_answers;
DROP POLICY IF EXISTS "Students can delete their own answers" ON student_answers;

DROP POLICY IF EXISTS "Anyone can view question likes" ON question_likes;
DROP POLICY IF EXISTS "Students can like questions" ON question_likes;
DROP POLICY IF EXISTS "Students can remove their own likes" ON question_likes;

DROP POLICY IF EXISTS "Anyone can view answer likes" ON answer_likes;
DROP POLICY IF EXISTS "Students can like answers" ON answer_likes;
DROP POLICY IF EXISTS "Students can remove their own likes" ON answer_likes;

-- 3. Tabloların mevcut durumunu kontrol et
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('student_questions', 'student_answers', 'question_likes', 'answer_likes');

-- Eğer rowsecurity = false ise başarılı!
