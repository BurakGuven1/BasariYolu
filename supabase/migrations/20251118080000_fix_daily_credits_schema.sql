-- Fix AI Credits Schema - Replace weekly credits with daily credits
-- This migration fixes the schema mismatch by dropping and recreating the table

-- =====================================================
-- Drop existing table and recreate with correct schema
-- =====================================================

-- Drop existing table (this will cascade delete all data)
DROP TABLE IF EXISTS public.student_ai_usage CASCADE;

-- Recreate with correct daily credits schema
CREATE TABLE public.student_ai_usage (
  student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_credits INTEGER DEFAULT 15,  -- 15 questions per day (not weekly)
  used_credits INTEGER DEFAULT 0,
  day_date DATE DEFAULT CURRENT_DATE,  -- Track by day (not week_start_date)
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_student_ai_usage_student_id ON public.student_ai_usage(student_id);
CREATE INDEX idx_student_ai_usage_day_date ON public.student_ai_usage(day_date);

-- Re-enable RLS
ALTER TABLE public.student_ai_usage ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policy
DROP POLICY IF EXISTS "Students can view own AI usage" ON public.student_ai_usage;
CREATE POLICY "Students can view own AI usage"
  ON public.student_ai_usage
  FOR SELECT
  USING (auth.uid() = student_id);

-- =====================================================
-- Recreate functions with correct schema
-- =====================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_student_ai_credits(UUID);
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT);

-- Recreate get_student_ai_credits function
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
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ as resets_at
  FROM public.student_ai_usage sau
  WHERE sau.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate use_ai_credit function
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
  IF v_remaining IS NULL OR v_remaining <= 0 THEN
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

-- Add comments
COMMENT ON TABLE public.student_ai_usage IS 'Tracks daily AI question credits for students (15 per day) - FIXED SCHEMA';
COMMENT ON FUNCTION public.get_student_ai_credits IS 'Gets current credit status, auto-resets daily - FIXED SCHEMA';
COMMENT ON FUNCTION public.use_ai_credit IS 'Deducts 1 credit and saves question - FIXED SCHEMA';
