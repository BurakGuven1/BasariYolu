-- Fix topic_recommendations and exam_weak_topics RLS policies
-- Ensure students can insert and manage their own recommendations and weak topics

-- ==============================================================
-- TOPIC RECOMMENDATIONS TABLE
-- ==============================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS topic_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  weakness_score NUMERIC NOT NULL DEFAULT 0,
  frequency_score NUMERIC NOT NULL DEFAULT 0,
  priority_score NUMERIC NOT NULL DEFAULT 0,
  recommendation_text TEXT,
  study_hours_needed NUMERIC DEFAULT 0,
  resources JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject, topic)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topic_recommendations_student_id
  ON topic_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_recommendations_priority_score
  ON topic_recommendations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_topic_recommendations_status
  ON topic_recommendations(status);

-- Enable RLS
ALTER TABLE topic_recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view their own recommendations" ON topic_recommendations;
DROP POLICY IF EXISTS "Students can insert their own recommendations" ON topic_recommendations;
DROP POLICY IF EXISTS "Students can update their own recommendations" ON topic_recommendations;
DROP POLICY IF EXISTS "Students can delete their own recommendations" ON topic_recommendations;

-- Create RLS policies
CREATE POLICY "Students can view their own recommendations"
  ON topic_recommendations
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own recommendations"
  ON topic_recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own recommendations"
  ON topic_recommendations
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own recommendations"
  ON topic_recommendations
  FOR DELETE
  USING (auth.uid() = student_id);

-- ==============================================================
-- EXAM WEAK TOPICS TABLE
-- ==============================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS exam_weak_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_result_id UUID REFERENCES exam_results(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  percentage_wrong NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_weak_topics_student_id
  ON exam_weak_topics(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_weak_topics_exam_result_id
  ON exam_weak_topics(exam_result_id);
CREATE INDEX IF NOT EXISTS idx_exam_weak_topics_subject_topic
  ON exam_weak_topics(subject, topic);

-- Enable RLS
ALTER TABLE exam_weak_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view their own weak topics" ON exam_weak_topics;
DROP POLICY IF EXISTS "Students can insert their own weak topics" ON exam_weak_topics;
DROP POLICY IF EXISTS "Students can update their own weak topics" ON exam_weak_topics;
DROP POLICY IF EXISTS "Students can delete their own weak topics" ON exam_weak_topics;

-- Create RLS policies
CREATE POLICY "Students can view their own weak topics"
  ON exam_weak_topics
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own weak topics"
  ON exam_weak_topics
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own weak topics"
  ON exam_weak_topics
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own weak topics"
  ON exam_weak_topics
  FOR DELETE
  USING (auth.uid() = student_id);

-- ==============================================================
-- UPDATED_AT TRIGGER
-- ==============================================================

-- Create or replace function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for topic_recommendations
DROP TRIGGER IF EXISTS update_topic_recommendations_updated_at ON topic_recommendations;
CREATE TRIGGER update_topic_recommendations_updated_at
  BEFORE UPDATE ON topic_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- GRANTS
-- ==============================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON topic_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_weak_topics TO authenticated;

-- Grant usage on sequences if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
