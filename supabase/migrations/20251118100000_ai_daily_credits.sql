/*
  # Daily AI Credits

  - Increase the default AI credit allowance to 15 per day
  - Switch helper functions to use a 24 hour (daily) reset instead of weekly periods
  - Keep the existing RPC names but update their implementations for the new cadence
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure table/columns exist (older environments may not have the AI schema yet)
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date date,
  week_end_date date,
  weekly_credits integer DEFAULT 5,
  used_credits integer DEFAULT 0,
  remaining_credits integer DEFAULT 5,
  last_reset timestamptz DEFAULT timezone('utc', now()),
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE public.ai_credits
  ADD COLUMN IF NOT EXISTS week_start_date date,
  ADD COLUMN IF NOT EXISTS week_end_date date,
  ADD COLUMN IF NOT EXISTS weekly_credits integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS used_credits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_credits integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_reset timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc', now());

-- Ensure new rows default to 15 credits per day
ALTER TABLE public.ai_credits
  ALTER COLUMN weekly_credits SET DEFAULT 15,
  ALTER COLUMN remaining_credits SET DEFAULT 15;

-- Normalize existing rows so nobody stays above the new daily limit
UPDATE public.ai_credits
SET weekly_credits = 15
WHERE weekly_credits IS NULL OR weekly_credits < 15;

UPDATE public.ai_credits
SET remaining_credits = LEAST(
  COALESCE(remaining_credits, weekly_credits),
  weekly_credits
)
WHERE remaining_credits > weekly_credits OR remaining_credits IS NULL;

-- ==================================================================
-- Helper functions rewritten for daily windows
-- ==================================================================

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
  v_day_start date := date_trunc('day', timezone('Europe/Istanbul', now()))::date;
  v_day_end date := v_day_start + 1;
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
    v_day_start,
    v_day_end,
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
    credits.weekly_credits,
    credits.used_credits,
    credits.remaining_credits,
    credits.week_start_date,
    credits.week_end_date
  FROM public.ai_credits AS credits
  WHERE credits.student_id = p_student_id
    AND credits.week_start_date = v_day_start;
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
  v_day_start date := date_trunc('day', timezone('Europe/Istanbul', now()))::date;
  v_day_end date := v_day_start + 1;
  v_credit public.ai_credits%ROWTYPE;
BEGIN
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'p_student_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_student_id THEN
    RAISE EXCEPTION 'You can only spend your own credits';
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
    v_day_start,
    v_day_end,
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
    AND week_start_date = v_day_start
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

  UPDATE public.ai_credits AS credits
  SET
    used_credits = credits.used_credits + 1,
    remaining_credits = GREATEST(credits.remaining_credits - 1, 0),
    updated_at = timezone('utc', now()),
    last_reset = CASE
      WHEN credits.week_start_date = v_day_start THEN credits.last_reset
      ELSE timezone('utc', now())
    END
  WHERE credits.id = v_credit.id;
END;
$$;

-- Even though the function name says weekly, it now seeds rows for the current day.
CREATE OR REPLACE FUNCTION public.reset_weekly_ai_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_start date := date_trunc('day', timezone('Europe/Istanbul', now()))::date;
  v_day_end date := v_day_start + 1;
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
      v_day_start,
      v_day_end,
      COALESCE(prev.weekly_credits, 15) AS weekly_credits,
      0,
      COALESCE(prev.weekly_credits, 15) AS remaining_credits,
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
        AND existing.week_start_date = v_day_start
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM new_rows;

  RETURN COALESCE(v_inserted, 0);
END;
$$;
