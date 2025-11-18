/*
  # AI Credits System

  - Introduces ai_credits + ai_questions tables for AI usage tracking
  - Adds student_ai_usage view for quick analytics
  - Implements helper functions used by the frontend + Edge Function:
      * get_student_ai_credits
      * use_ai_credit
      * reset_weekly_ai_credits
  - Enables RLS with policies scoped to the authenticated student
*/

-- Ensure pgcrypto is available for gen_random_uuid (safe if already installed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- AI Credits Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  weekly_credits integer NOT NULL DEFAULT 5 CHECK (weekly_credits > 0),
  used_credits integer NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
  remaining_credits integer NOT NULL DEFAULT 5 CHECK (remaining_credits >= 0),
  last_reset timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT ai_credits_unique_week UNIQUE (student_id, week_start_date),
  CONSTRAINT ai_credits_used_lte_weekly CHECK (used_credits <= weekly_credits),
  CONSTRAINT ai_credits_remaining_lte_weekly CHECK (remaining_credits <= weekly_credits)
);

CREATE INDEX IF NOT EXISTS idx_ai_credits_student_week
  ON public.ai_credits (student_id, week_start_date DESC);

CREATE TRIGGER set_ai_credits_updated_at
BEFORE UPDATE ON public.ai_credits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own AI credits"
ON public.ai_credits
FOR SELECT
USING (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AI Questions Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  model_used text NOT NULL DEFAULT 'gpt-4o-mini',
  category text,
  asked_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_questions_student
  ON public.ai_questions (student_id, asked_at DESC);

ALTER TABLE public.ai_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own AI questions"
ON public.ai_questions
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own AI questions"
ON public.ai_questions
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Aggregated usage view
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.student_ai_usage;

CREATE VIEW public.student_ai_usage AS
SELECT
  p.id AS student_id,
  p.full_name,
  p.email,
  COUNT(q.id) AS total_questions,
  COUNT(q.id) FILTER (
    WHERE q.asked_at >= date_trunc('week', timezone('Europe/Istanbul', now()))
  ) AS questions_this_week,
  COALESCE(SUM(q.tokens_used), 0) AS total_tokens_used,
  MAX(q.asked_at) AS last_question_at
FROM public.profiles p
LEFT JOIN public.ai_questions q ON q.student_id = p.id
GROUP BY p.id, p.full_name, p.email;

GRANT SELECT ON public.student_ai_usage TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_ai_credits(p_student_id uuid)
RETURNS TABLE (
  weekly_credits integer,
  used_credits integer,
  remaining_credits integer,
  week_start_date date,
  week_end_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', timezone('Europe/Istanbul', now()))::date;
  v_week_end date := v_week_start + 6;
BEGIN
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'p_student_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_student_id THEN
    RAISE EXCEPTION 'You can only view your own credits';
  END IF;

  INSERT INTO public.ai_credits (
    student_id,
    week_start_date,
    week_end_date,
    weekly_credits,
    used_credits,
    remaining_credits,
    last_reset
  )
  VALUES (
    p_student_id,
    v_week_start,
    v_week_end,
    DEFAULT,
    DEFAULT,
    DEFAULT,
    timezone('utc', now())
  )
  ON CONFLICT (student_id, week_start_date)
  DO UPDATE SET
    week_end_date = EXCLUDED.week_end_date,
    updated_at = timezone('utc', now());

  RETURN QUERY
  SELECT
    weekly_credits,
    used_credits,
    remaining_credits,
    week_start_date,
    week_end_date
  FROM public.ai_credits
  WHERE student_id = p_student_id
    AND week_start_date = v_week_start;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_ai_credit(
  p_student_id uuid,
  p_question text,
  p_answer text,
  p_tokens_used integer DEFAULT 0,
  p_model_used text DEFAULT 'gpt-4o-mini',
  p_category text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', timezone('Europe/Istanbul', now()))::date;
  v_week_end date := v_week_start + 6;
  v_credit public.ai_credits%ROWTYPE;
BEGIN
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'p_student_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_student_id THEN
    RAISE EXCEPTION 'You can only spend your own credits';
  END IF;

  -- Ensure week row exists
  INSERT INTO public.ai_credits (
    student_id,
    week_start_date,
    week_end_date,
    weekly_credits,
    used_credits,
    remaining_credits,
    last_reset
  )
  VALUES (
    p_student_id,
    v_week_start,
    v_week_end,
    DEFAULT,
    DEFAULT,
    DEFAULT,
    timezone('utc', now())
  )
  ON CONFLICT (student_id, week_start_date)
  DO NOTHING;

  SELECT *
  INTO v_credit
  FROM public.ai_credits
  WHERE student_id = p_student_id
    AND week_start_date = v_week_start
  FOR UPDATE;

  IF v_credit.remaining_credits <= 0 THEN
    RAISE EXCEPTION 'NO_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.ai_questions (
    student_id,
    question,
    answer,
    tokens_used,
    model_used,
    category,
    asked_at
  ) VALUES (
    p_student_id,
    p_question,
    p_answer,
    COALESCE(p_tokens_used, 0),
    COALESCE(p_model_used, 'gpt-4o-mini'),
    p_category,
    timezone('utc', now())
  );

  UPDATE public.ai_credits
  SET
    used_credits = used_credits + 1,
    remaining_credits = GREATEST(remaining_credits - 1, 0),
    updated_at = timezone('utc', now())
  WHERE id = v_credit.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_weekly_ai_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', timezone('Europe/Istanbul', now()))::date;
  v_week_end date := v_week_start + 6;
  v_inserted integer;
BEGIN
  WITH new_rows AS (
    INSERT INTO public.ai_credits (
      student_id,
      week_start_date,
      week_end_date,
      weekly_credits,
      used_credits,
      remaining_credits,
      last_reset
    )
    SELECT
      p.id,
      v_week_start,
      v_week_end,
      COALESCE(prev.weekly_credits, 5) AS weekly_credits,
      0,
      COALESCE(prev.weekly_credits, 5) AS remaining_credits,
      timezone('utc', now())
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT weekly_credits
      FROM public.ai_credits ac
      WHERE ac.student_id = p.id
      ORDER BY ac.week_start_date DESC
      LIMIT 1
    ) prev ON true
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.ai_credits existing
      WHERE existing.student_id = p.id
        AND existing.week_start_date = v_week_start
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM new_rows;

  RETURN COALESCE(v_inserted, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_ai_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.use_ai_credit(uuid, text, text, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_weekly_ai_credits() TO authenticated, service_role;

COMMENT ON TABLE public.ai_credits IS 'Tracks weekly AI credit balances per student.';
COMMENT ON TABLE public.ai_questions IS 'Stores AI question/answer history per student.';
