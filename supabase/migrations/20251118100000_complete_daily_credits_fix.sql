-- FINAL FIX: Completely clean and recreate AI credits system
-- This script will run once and fix everything

-- =====================================================
-- STEP 1: Drop ALL existing functions (all signatures)
-- =====================================================

-- Drop all possible variations of use_ai_credit
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT) CASCADE;

-- Drop all possible variations of get_student_ai_credits
DROP FUNCTION IF EXISTS public.get_student_ai_credits(UUID) CASCADE;

-- Drop all possible variations of get_ai_usage_stats
DROP FUNCTION IF EXISTS public.get_ai_usage_stats(UUID) CASCADE;

-- =====================================================
-- STEP 2: Drop VIEW/TABLE (whichever exists)
-- =====================================================

-- Drop VIEW first (if exists)
DROP VIEW IF EXISTS public.student_ai_usage CASCADE;

-- Drop TABLE (if exists)
DROP TABLE IF EXISTS public.student_ai_usage CASCADE;

-- =====================================================
-- STEP 3: Create fresh TABLE with daily credits schema
-- =====================================================

CREATE TABLE public.student_ai_usage (
  student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_credits INTEGER NOT NULL DEFAULT 15,
  used_credits INTEGER NOT NULL DEFAULT 0,
  day_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_student_ai_usage_student_id ON public.student_ai_usage(student_id);
CREATE INDEX idx_student_ai_usage_day_date ON public.student_ai_usage(day_date);

-- Enable RLS
ALTER TABLE public.student_ai_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Students can view own AI usage"
  ON public.student_ai_usage
  FOR SELECT
  USING (auth.uid() = student_id);

-- =====================================================
-- STEP 4: Create get_student_ai_credits function
-- =====================================================

CREATE FUNCTION public.get_student_ai_credits(p_student_id UUID)
RETURNS TABLE (
  daily_credits INTEGER,
  used_credits INTEGER,
  remaining_credits INTEGER,
  day_date DATE,
  resets_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset credits if new day
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
    (sau.daily_credits - sau.used_credits)::INTEGER as remaining_credits,
    sau.day_date,
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ as resets_at
  FROM public.student_ai_usage sau
  WHERE sau.student_id = p_student_id;
END;
$$;

-- =====================================================
-- STEP 5: Create use_ai_credit function (SINGLE VERSION)
-- =====================================================

CREATE FUNCTION public.use_ai_credit(
  p_student_id UUID,
  p_question TEXT,
  p_answer TEXT,
  p_tokens_used INTEGER,
  p_model_used TEXT,
  p_category TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- =====================================================
-- STEP 6: Create get_ai_usage_stats function
-- =====================================================

CREATE FUNCTION public.get_ai_usage_stats(p_student_id UUID)
RETURNS TABLE (
  total_questions BIGINT,
  total_tokens BIGINT,
  questions_today BIGINT,
  most_used_model TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_questions,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    COUNT(*) FILTER (WHERE asked_at::DATE = CURRENT_DATE)::BIGINT as questions_today,
    mode() WITHIN GROUP (ORDER BY model_used) as most_used_model
  FROM public.ai_questions
  WHERE student_id = p_student_id;
END;
$$;

-- =====================================================
-- STEP 7: Add helpful comments
-- =====================================================

COMMENT ON TABLE public.student_ai_usage IS 'Daily AI credits tracking (15 questions per student per day)';
COMMENT ON COLUMN public.student_ai_usage.daily_credits IS 'Total daily credits (always 15)';
COMMENT ON COLUMN public.student_ai_usage.used_credits IS 'Credits used today';
COMMENT ON COLUMN public.student_ai_usage.day_date IS 'Current day (auto-resets at midnight)';

COMMENT ON FUNCTION public.get_student_ai_credits(UUID) IS 'Returns current credit status, auto-resets daily at midnight';
COMMENT ON FUNCTION public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) IS 'Deducts 1 credit and saves question to history';
COMMENT ON FUNCTION public.get_ai_usage_stats(UUID) IS 'Returns AI usage statistics for student';

-- =====================================================
-- SUCCESS! You can now test:
-- 1. Login as student
-- 2. Ask AI a question
-- 3. Credits should decrease from 15 to 14
-- =====================================================
