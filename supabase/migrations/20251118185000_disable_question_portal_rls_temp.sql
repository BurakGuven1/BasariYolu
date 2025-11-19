-- Temporarily disable RLS for testing student question portal
-- This will allow us to test the basic functionality before re-enabling with correct policies

-- Disable RLS on all question portal tables
ALTER TABLE student_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE answer_likes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (we'll recreate them later with proper configuration)
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
