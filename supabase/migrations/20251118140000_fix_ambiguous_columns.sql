-- Fix ambiguous column references in AI credits functions
-- Fully qualify all column names to prevent "column is ambiguous" errors

-- =====================================================
-- Drop existing functions
-- =====================================================
DO $$
DECLARE
  func_oid OID;
BEGIN
  FOR func_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_student_ai_credits', 'use_ai_credit')
  LOOP
    EXECUTE format('DROP FUNCTION %s', func_oid::regprocedure);
  END LOOP;
END $$;

-- =====================================================
-- Recreate get_student_ai_credits with qualified columns
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
  -- Reset credits if new day (FULLY QUALIFIED COLUMNS)
  UPDATE public.student_ai_usage
  SET
    used_credits = 0,
    day_date = CURRENT_DATE,
    updated_at = CURRENT_TIMESTAMP
  WHERE student_ai_usage.student_id = p_student_id
    AND student_ai_usage.day_date < CURRENT_DATE;

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
-- Recreate use_ai_credit with qualified columns
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
  -- Get remaining credits (FULLY QUALIFIED COLUMNS)
  SELECT (sau.daily_credits - sau.used_credits) INTO v_remaining
  FROM public.student_ai_usage sau
  WHERE sau.student_id = p_student_id;

  -- Check if credits available
  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RAISE EXCEPTION 'No AI credits remaining for today';
  END IF;

  -- Increment used credits (FULLY QUALIFIED COLUMNS)
  UPDATE public.student_ai_usage sau
  SET
    used_credits = sau.used_credits + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE sau.student_id = p_student_id;

  -- Save question/answer to history
  INSERT INTO public.ai_questions (student_id, question, answer, tokens_used, model_used, category)
  VALUES (p_student_id, p_question, p_answer, p_tokens_used, p_model_used, p_category);
END;
$$;

COMMENT ON FUNCTION public.get_student_ai_credits(UUID) IS 'Returns daily AI credits with fully qualified columns';
COMMENT ON FUNCTION public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) IS 'Deducts 1 credit with fully qualified columns';
