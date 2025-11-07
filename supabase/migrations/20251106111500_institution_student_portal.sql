/*
  # Institution Student Portal Enhancements

  1. Question content improvements
    - Add passage_text and question_prompt fields for richer question authoring.
    - Keep archive table/function in sync.

  2. Institution student onboarding
    - Extend institutions with invite code + quota tracking.
    - Introduce institution_student_requests table for approval workflow.
    - Track approved counts and enforce quota via trigger.

  3. Security
    - Enable RLS for new table with policies for institution staff and students.
*/

-- Enrich question structure
ALTER TABLE public.institution_questions
  ADD COLUMN IF NOT EXISTS passage_text text,
  ADD COLUMN IF NOT EXISTS question_prompt text;

ALTER TABLE public.institution_question_archive
  ADD COLUMN IF NOT EXISTS passage_text text,
  ADD COLUMN IF NOT EXISTS question_prompt text;

-- Refresh archive sync function with the new fields
CREATE OR REPLACE FUNCTION public.sync_institution_question_archive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.institution_question_archive (
    source_question_id,
    institution_id,
    question_type,
    subject,
    topic,
    difficulty,
    question_text,
    question_prompt,
    passage_text,
    choices,
    answer_key,
    explanation,
    tags,
    metadata,
    is_published,
    last_synced_at,
    deleted_at
  )
  VALUES (
    NEW.id,
    NEW.institution_id,
    NEW.question_type,
    NEW.subject,
    NEW.topic,
    NEW.difficulty,
    NEW.question_text,
    NEW.question_prompt,
    NEW.passage_text,
    NEW.choices,
    NEW.answer_key,
    NEW.explanation,
    NEW.tags,
    NEW.metadata,
    NEW.is_published,
    now(),
    NULL
  )
  ON CONFLICT (source_question_id)
  DO UPDATE SET
    institution_id = EXCLUDED.institution_id,
    question_type = EXCLUDED.question_type,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic,
    difficulty = EXCLUDED.difficulty,
    question_text = EXCLUDED.question_text,
    question_prompt = EXCLUDED.question_prompt,
    passage_text = EXCLUDED.passage_text,
    choices = EXCLUDED.choices,
    answer_key = EXCLUDED.answer_key,
    explanation = EXCLUDED.explanation,
    tags = EXCLUDED.tags,
    metadata = EXCLUDED.metadata,
    is_published = EXCLUDED.is_published,
    last_synced_at = now(),
    deleted_at = NULL;

  UPDATE public.institution_question_archive
  SET first_ingested_at = COALESCE(first_ingested_at, now())
  WHERE source_question_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Extend institutions with invite metadata
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS student_invite_code text UNIQUE DEFAULT concat('INST-', encode(gen_random_bytes(4), 'hex')),
  ADD COLUMN IF NOT EXISTS student_quota integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_student_count integer NOT NULL DEFAULT 0;

UPDATE public.institutions
SET student_invite_code = concat('INST-', encode(gen_random_bytes(4), 'hex'))
WHERE student_invite_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_institutions_invite_code ON public.institutions(student_invite_code);

-- Student request workflow table
CREATE TABLE IF NOT EXISTS public.institution_student_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_student_requests_institution ON public.institution_student_requests(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_student_requests_status ON public.institution_student_requests(status);
CREATE INDEX IF NOT EXISTS idx_institution_student_requests_user ON public.institution_student_requests(user_id);

-- Maintain updated_at automatically
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_institution_student_requests_updated_at
BEFORE UPDATE ON public.institution_student_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Quota enforcement
CREATE OR REPLACE FUNCTION public.enforce_institution_student_quota()
RETURNS TRIGGER AS $$
DECLARE
  quota integer;
  approved_count integer;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT student_quota, approved_student_count INTO quota, approved_count
    FROM public.institutions
    WHERE id = NEW.institution_id
    FOR UPDATE;

    IF quota > 0 AND approved_count >= quota THEN
      RAISE EXCEPTION 'Institution quota reached';
    END IF;

    UPDATE public.institutions
    SET approved_student_count = approved_student_count + 1
    WHERE id = NEW.institution_id;

    NEW.approved_at = now();
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.institutions
    SET approved_student_count = GREATEST(approved_student_count - 1, 0)
    WHERE id = NEW.institution_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_institution_student_quota_trigger
BEFORE UPDATE OF status ON public.institution_student_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_institution_student_quota();

-- Enable RLS
ALTER TABLE public.institution_student_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution staff manage student requests"
ON public.institution_student_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_student_requests.institution_id
      AND im.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_student_requests.institution_id
      AND im.user_id = auth.uid()
  )
);

CREATE POLICY "Students can view own requests"
ON public.institution_student_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Students can insert own request"
ON public.institution_student_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.institution_student_requests IS 'Pending and approved institution-managed student access requests.';
