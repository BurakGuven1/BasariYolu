-- Create Student Question Portal tables for peer learning
-- This migration creates tables for students to share questions and receive answers

-- Table: student_questions
-- Stores questions posted by students
CREATE TABLE IF NOT EXISTS student_questions (
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

-- Table: student_answers
-- Stores answers/solutions from other students
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  image_url TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: question_likes
-- Stores likes/upvotes for questions
CREATE TABLE IF NOT EXISTS question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, student_id)
);

-- Table: answer_likes
-- Stores likes/upvotes for answers
CREATE TABLE IF NOT EXISTS answer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(answer_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_questions_student_id ON student_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_questions_created_at ON student_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_questions_subject ON student_questions(subject);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_question_likes_question_id ON question_likes(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_likes_answer_id ON answer_likes(answer_id);

-- Enable Row Level Security
ALTER TABLE student_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_questions
CREATE POLICY "Anyone can view questions"
  ON student_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create questions"
  ON student_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own questions"
  ON student_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own questions"
  ON student_questions FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS Policies for student_answers
CREATE POLICY "Anyone can view answers"
  ON student_answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create answers"
  ON student_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own answers"
  ON student_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own answers"
  ON student_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS Policies for question_likes
CREATE POLICY "Anyone can view question likes"
  ON question_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can like questions"
  ON question_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can remove their own likes"
  ON question_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS Policies for answer_likes
CREATE POLICY "Anyone can view answer likes"
  ON answer_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can like answers"
  ON answer_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can remove their own likes"
  ON answer_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_student_questions_updated_at
  BEFORE UPDATE ON student_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at
  BEFORE UPDATE ON student_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_question_view_count(question_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE student_questions
  SET view_count = view_count + 1
  WHERE id = question_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
