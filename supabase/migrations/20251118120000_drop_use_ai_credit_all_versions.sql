-- Drop ALL use_ai_credit function versions by specifying each signature
-- This solves "function name is not unique" error

-- =====================================================
-- Drop all possible use_ai_credit signatures
-- =====================================================

-- 6 parameters version (with category)
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT);

-- 5 parameters version (without category)
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT);

-- 4 parameters version (minimal)
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER);

-- 3 parameters version
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT);

-- Any other possible variations
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, UUID);

-- =====================================================
-- Create SINGLE new function (6 params with DEFAULT)
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

COMMENT ON FUNCTION public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) IS 'Deducts 1 credit and saves question - FINAL SINGLE VERSION';

-- =====================================================
-- VERIFY: Run this after to check only 1 exists:
-- SELECT routine_name, COUNT(*)
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'use_ai_credit'
-- GROUP BY routine_name;
-- Expected: use_ai_credit | 1
-- =====================================================
