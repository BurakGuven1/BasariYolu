-- AI Credits System Migration
-- This migration creates tables and functions for managing AI chat credits
-- Daily credit limit: 15 questions per student per day

-- =====================================================
-- Drop Old Functions (if they exist with different signatures)
-- =====================================================
DROP FUNCTION IF EXISTS public.get_student_ai_credits(UUID);
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_ai_usage_stats(UUID);

-- =====================================================
-- AI Credits Table
-- =====================================================
-- Tracks daily AI question credits for each student
CREATE TABLE IF NOT EXISTS public.student_ai_usage (
  student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_credits INTEGER DEFAULT 15,  -- 15 questions per day
  used_credits INTEGER DEFAULT 0,
  day_date DATE DEFAULT CURRENT_DATE,  -- Track by day instead of week
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AI Questions History Table
-- =====================================================
-- Stores all AI questions asked by students
CREATE TABLE IF NOT EXISTS public.ai_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT DEFAULT 'gpt-4o-mini',
  category TEXT,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  asked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_student_ai_usage_student_id ON public.student_ai_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_usage_day_date ON public.student_ai_usage(day_date);
CREATE INDEX IF NOT EXISTS idx_ai_questions_student_id ON public.ai_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_questions_asked_at ON public.ai_questions(asked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_questions_conversation_id ON public.ai_questions(conversation_id);

-- =====================================================
-- RPC: Get Student AI Credits
-- =====================================================
-- Returns current credit status for a student
-- Auto-resets credits if new day
CREATE OR REPLACE FUNCTION public.get_student_ai_credits(p_student_id UUID)
RETURNS TABLE (
  daily_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  day_date DATE,
  resets_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if day has changed (reset credits daily)
  UPDATE public.student_ai_usage
  SET
    used_credits = 0,
    day_date = CURRENT_DATE,
    updated_at = CURRENT_TIMESTAMP
  WHERE student_id = p_student_id
    AND day_date < CURRENT_DATE;

  -- Create record if doesn't exist
  INSERT INTO public.student_ai_usage (student_id, daily_credits, used_credits, day_date)
  VALUES (p_student_id, 15, 0, CURRENT_DATE)
  ON CONFLICT (student_id) DO NOTHING;

  -- Return credits info
  RETURN QUERY
  SELECT
    sau.daily_credits,
    sau.used_credits,
    (sau.daily_credits - sau.used_credits) as remaining_credits,
    sau.day_date,
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ as resets_at  -- Midnight next day
  FROM public.student_ai_usage sau
  WHERE sau.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RPC: Use AI Credit
-- =====================================================
-- Deducts 1 credit and saves question to history
-- Returns error if no credits remaining
CREATE OR REPLACE FUNCTION public.use_ai_credit(
  p_student_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_tokens_used INTEGER,
  p_model_used TEXT,
  p_category TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Get remaining credits
  SELECT (daily_credits - used_credits) INTO v_remaining
  FROM public.student_ai_usage
  WHERE student_id = p_student_id;

  -- Check if credits available
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'No AI credits remaining for today';
  END IF;

  -- Increment used credits
  UPDATE public.student_ai_usage
  SET
    used_credits = used_credits + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE student_id = p_student_id;

  -- Save question/answer to history
  INSERT INTO public.ai_questions (student_id, question, answer, tokens_used, model_used, category)
  VALUES (p_student_id, p_question, p_answer, p_tokens_used, p_model_used, p_category);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE public.student_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_questions ENABLE ROW LEVEL SECURITY;

-- Students can view their own AI usage
CREATE POLICY "Students can view own AI usage"
  ON public.student_ai_usage
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can view their own AI questions
CREATE POLICY "Students can view own AI questions"
  ON public.ai_questions
  FOR SELECT
  USING (auth.uid() = student_id);

-- =====================================================
-- Helper Function: Get AI Question Stats
-- =====================================================
-- Returns statistics about AI usage
CREATE OR REPLACE FUNCTION public.get_ai_usage_stats(p_student_id UUID)
RETURNS TABLE (
  total_questions BIGINT,
  total_tokens BIGINT,
  questions_today BIGINT,
  most_used_model TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_questions,
    SUM(tokens_used) as total_tokens,
    COUNT(*) FILTER (WHERE asked_at::DATE = CURRENT_DATE) as questions_today,
    mode() WITHIN GROUP (ORDER BY model_used) as most_used_model
  FROM public.ai_questions
  WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE public.student_ai_usage IS 'Tracks daily AI question credits for students (15 per day)';
COMMENT ON TABLE public.ai_questions IS 'History of all AI questions asked by students';
COMMENT ON FUNCTION public.get_student_ai_credits IS 'Gets current credit status, auto-resets daily';
COMMENT ON FUNCTION public.use_ai_credit IS 'Deducts 1 credit and saves question';
COMMENT ON FUNCTION public.get_ai_usage_stats IS 'Returns AI usage statistics for a student';
