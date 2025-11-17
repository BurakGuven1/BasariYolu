-- AI Credits System for Professional Package Users
-- Allows professional users to ask AI questions with weekly credit limits

-- AI Credits table - tracks weekly credits for each student
CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekly_credits INTEGER NOT NULL DEFAULT 10,
  used_credits INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per student per week
  UNIQUE(student_id, week_start_date)
);

-- AI Questions table - stores all questions and answers
CREATE TABLE IF NOT EXISTS ai_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tokens_used INTEGER,
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  category VARCHAR(100), -- e.g., 'Matematik', 'Fizik', 'Genel'
  asked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get current week's credits for a student
CREATE OR REPLACE FUNCTION get_student_ai_credits(p_student_id UUID)
RETURNS TABLE (
  weekly_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  week_start_date DATE,
  week_end_date DATE
) AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_record RECORD;
BEGIN
  -- Calculate current week (Monday to Sunday)
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE; -- Monday
  v_week_end := (v_week_start + INTERVAL '6 days')::DATE; -- Sunday

  -- Try to get existing record
  SELECT
    ac.weekly_credits,
    ac.used_credits,
    (ac.weekly_credits - ac.used_credits) as remaining_credits,
    ac.week_start_date,
    ac.week_end_date
  INTO v_record
  FROM ai_credits ac
  WHERE ac.student_id = p_student_id
    AND ac.week_start_date = v_week_start;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO ai_credits (student_id, weekly_credits, used_credits, week_start_date, week_end_date)
    VALUES (p_student_id, 10, 0, v_week_start, v_week_end)
    RETURNING
      ai_credits.weekly_credits,
      ai_credits.used_credits,
      (ai_credits.weekly_credits - ai_credits.used_credits),
      ai_credits.week_start_date,
      ai_credits.week_end_date
    INTO v_record;
  END IF;

  -- Return the record
  RETURN QUERY SELECT
    v_record.weekly_credits,
    v_record.used_credits,
    v_record.remaining_credits,
    v_record.week_start_date,
    v_record.week_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to use AI credit (called when asking a question)
CREATE OR REPLACE FUNCTION use_ai_credit(
  p_student_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_tokens_used INTEGER DEFAULT 0,
  p_model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  p_category VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_remaining INTEGER;
BEGIN
  -- Calculate current week
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_week_end := (v_week_start + INTERVAL '6 days')::DATE;

  -- Get remaining credits
  SELECT (weekly_credits - used_credits) INTO v_remaining
  FROM ai_credits
  WHERE student_id = p_student_id
    AND week_start_date = v_week_start;

  -- If no record, create one and check again
  IF NOT FOUND THEN
    INSERT INTO ai_credits (student_id, weekly_credits, used_credits, week_start_date, week_end_date)
    VALUES (p_student_id, 10, 0, v_week_start, v_week_end);
    v_remaining := 10;
  END IF;

  -- Check if credits available
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'No credits remaining for this week';
    RETURN FALSE;
  END IF;

  -- Use one credit
  UPDATE ai_credits
  SET
    used_credits = used_credits + 1,
    updated_at = NOW()
  WHERE student_id = p_student_id
    AND week_start_date = v_week_start;

  -- Save question and answer
  INSERT INTO ai_questions (
    student_id,
    question,
    answer,
    tokens_used,
    model_used,
    category
  ) VALUES (
    p_student_id,
    p_question,
    p_answer,
    p_tokens_used,
    p_model_used,
    p_category
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset credits for a new week (to be called by cron)
CREATE OR REPLACE FUNCTION reset_weekly_ai_credits()
RETURNS INTEGER AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_count INTEGER;
BEGIN
  -- Calculate current week
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_week_end := (v_week_start + INTERVAL '6 days')::DATE;

  -- Create new weekly records for all students who have used AI before
  INSERT INTO ai_credits (student_id, weekly_credits, used_credits, week_start_date, week_end_date)
  SELECT DISTINCT
    student_id,
    10, -- weekly credits
    0,  -- used credits reset to 0
    v_week_start,
    v_week_end
  FROM ai_questions
  WHERE student_id NOT IN (
    SELECT student_id
    FROM ai_credits
    WHERE week_start_date = v_week_start
  )
  ON CONFLICT (student_id, week_start_date) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- View for student AI usage statistics
CREATE OR REPLACE VIEW student_ai_usage AS
SELECT
  p.id as student_id,
  p.full_name,
  COUNT(aq.id) as total_questions,
  COUNT(DISTINCT DATE(aq.asked_at)) as active_days,
  SUM(aq.tokens_used) as total_tokens_used,
  MAX(aq.asked_at) as last_question_at,
  COUNT(aq.id) FILTER (WHERE aq.asked_at >= DATE_TRUNC('week', CURRENT_DATE)) as questions_this_week
FROM profiles p
LEFT JOIN ai_questions aq ON p.id = aq.student_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name;

-- Grant permissions
GRANT SELECT ON ai_credits TO authenticated;
GRANT INSERT, UPDATE ON ai_credits TO authenticated;
GRANT SELECT, INSERT ON ai_questions TO authenticated;
GRANT SELECT ON student_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_ai_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_ai_credit(UUID, TEXT, TEXT, INTEGER, VARCHAR, VARCHAR) TO authenticated;

-- Enable RLS
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_credits
CREATE POLICY "Students can view their own AI credits"
  ON ai_credits FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own AI credits"
  ON ai_credits FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own AI credits"
  ON ai_credits FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for ai_questions
CREATE POLICY "Students can view their own AI questions"
  ON ai_questions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own AI questions"
  ON ai_questions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_credits_student_week ON ai_credits(student_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_ai_questions_student_date ON ai_questions(student_id, asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_questions_category ON ai_questions(category);

-- Comments
COMMENT ON TABLE ai_credits IS 'Tracks weekly AI question credits for professional package students';
COMMENT ON TABLE ai_questions IS 'Stores all AI questions and answers with metadata';
COMMENT ON FUNCTION get_student_ai_credits IS 'Gets current weeks AI credits for a student, creates record if not exists';
COMMENT ON FUNCTION use_ai_credit IS 'Uses one AI credit and saves question/answer. Returns false if no credits remaining';
COMMENT ON FUNCTION reset_weekly_ai_credits IS 'Resets AI credits for new week. Should be called via cron every Monday';
