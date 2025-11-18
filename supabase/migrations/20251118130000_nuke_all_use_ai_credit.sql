-- NUCLEAR OPTION: Drop ALL use_ai_credit functions with EXACT signatures
-- Based on actual database inspection showing 4 functions with 2 different signatures

-- =====================================================
-- Drop character varying version (with DEFAULT values)
-- =====================================================
DROP FUNCTION IF EXISTS public.use_ai_credit(
  p_student_id uuid,
  p_question text,
  p_answer text,
  p_tokens_used integer,
  p_model_used character varying,
  p_category character varying
);

-- =====================================================
-- Drop text version (with DEFAULT NULL)
-- =====================================================
DROP FUNCTION IF EXISTS public.use_ai_credit(
  p_student_id uuid,
  p_question text,
  p_answer text,
  p_tokens_used integer,
  p_model_used text,
  p_category text
);

-- =====================================================
-- Also try dropping with schemas specified
-- =====================================================
DROP FUNCTION IF EXISTS use_ai_credit(uuid, text, text, integer, character varying, character varying);
DROP FUNCTION IF EXISTS use_ai_credit(uuid, text, text, integer, text, text);

-- =====================================================
-- Drop any remaining variations
-- =====================================================
DROP FUNCTION IF EXISTS public.use_ai_credit(uuid, text, text, integer, text);
DROP FUNCTION IF EXISTS public.use_ai_credit(uuid, text, text, integer);
DROP FUNCTION IF EXISTS public.use_ai_credit(uuid, text, text);

-- =====================================================
-- Use pg_proc to drop by OID (guaranteed to work)
-- =====================================================
DO $$
DECLARE
  func_oid OID;
BEGIN
  -- Loop through all use_ai_credit functions and drop them
  FOR func_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'use_ai_credit'
  LOOP
    EXECUTE format('DROP FUNCTION %s', func_oid::regprocedure);
    RAISE NOTICE 'Dropped function: %', func_oid::regprocedure;
  END LOOP;
END $$;

-- =====================================================
-- Verify all are gone
-- =====================================================
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'use_ai_credit';

  IF func_count > 0 THEN
    RAISE EXCEPTION 'Still have % use_ai_credit functions remaining!', func_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All use_ai_credit functions removed!';
  END IF;
END $$;

-- =====================================================
-- Create NEW SINGLE function (clean slate)
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

COMMENT ON FUNCTION public.use_ai_credit(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) IS 'Deducts 1 AI credit and saves question - FINAL CLEAN VERSION';

-- =====================================================
-- Final verification
-- =====================================================
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'use_ai_credit';

  RAISE NOTICE 'Total use_ai_credit functions after recreation: %', func_count;

  IF func_count != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 use_ai_credit function, but found %', func_count;
  END IF;
END $$;
