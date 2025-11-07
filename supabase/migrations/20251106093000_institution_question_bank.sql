/*
  # Institution Question Bank & Exam Blueprints

  1. New Tables
    - `institution_questions` - Institution scoped question bank
    - `institution_exam_blueprints` - Saved exam templates referencing question ids
    - `institution_question_archive` - Global archive of all institution questions

  2. Supporting Functions & Triggers
    - Upsert archive rows on question insert/update, flag on delete
    - Timestamp trigger helper for automatic `updated_at`
    - Dashboard summary helper function for performant analytics

  3. Security
    - Enable RLS on institution owned tables with membership based policies
    - Keep archive internal (no RLS policies exposed)
*/

-- Helper function to auto-manage updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main question bank table
CREATE TABLE IF NOT EXISTS public.institution_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'written')),
  subject text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_key text,
  explanation text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exam blueprint table referencing question ids
CREATE TABLE IF NOT EXISTS public.institution_exam_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  exam_type text NOT NULL DEFAULT 'custom',
  description text,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  question_count integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  question_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Central archive capturing every institution question (aggregated store)
CREATE TABLE IF NOT EXISTS public.institution_question_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_question_id uuid UNIQUE NOT NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  question_type text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  difficulty text,
  question_text text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_key text,
  explanation text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  first_ingested_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_institution_questions_institution ON public.institution_questions(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_questions_subject ON public.institution_questions(institution_id, subject);
CREATE INDEX IF NOT EXISTS idx_institution_questions_topic ON public.institution_questions(institution_id, topic);
CREATE INDEX IF NOT EXISTS idx_institution_questions_published ON public.institution_questions(is_published);

CREATE INDEX IF NOT EXISTS idx_institution_exam_blueprints_institution ON public.institution_exam_blueprints(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_exam_blueprints_created_by ON public.institution_exam_blueprints(created_by);

CREATE INDEX IF NOT EXISTS idx_institution_question_archive_institution ON public.institution_question_archive(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_question_archive_subject ON public.institution_question_archive(subject);
CREATE INDEX IF NOT EXISTS idx_institution_question_archive_topic ON public.institution_question_archive(topic);

-- Updated_at triggers
CREATE TRIGGER set_institution_questions_updated_at
BEFORE UPDATE ON public.institution_questions
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_institution_exam_blueprints_updated_at
BEFORE UPDATE ON public.institution_exam_blueprints
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Archive sync helper functions
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
    choices = EXCLUDED.choices,
    answer_key = EXCLUDED.answer_key,
    explanation = EXCLUDED.explanation,
    tags = EXCLUDED.tags,
    metadata = EXCLUDED.metadata,
    is_published = EXCLUDED.is_published,
    last_synced_at = now(),
    deleted_at = NULL;

  -- Ensure created timestamp is preserved on first insert
  UPDATE public.institution_question_archive
  SET first_ingested_at = COALESCE(first_ingested_at, now())
  WHERE source_question_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.flag_institution_question_archive_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.institution_question_archive
  SET deleted_at = now(),
      last_synced_at = now()
  WHERE source_question_id = OLD.id;

  RETURN OLD;
END;
$$;

-- Archive triggers
CREATE TRIGGER institution_questions_sync_archive
AFTER INSERT OR UPDATE ON public.institution_questions
FOR EACH ROW EXECUTE FUNCTION public.sync_institution_question_archive();

CREATE TRIGGER institution_questions_archive_deleted
AFTER DELETE ON public.institution_questions
FOR EACH ROW EXECUTE FUNCTION public.flag_institution_question_archive_deleted();

-- Dashboard helper function for efficient aggregates
CREATE OR REPLACE FUNCTION public.institution_question_dashboard(p_institution_id uuid)
RETURNS TABLE (
  total_questions integer,
  published_questions integer,
  draft_questions integer,
  subjects jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH subject_stats AS (
    SELECT
      subject,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE is_published) AS published,
      COUNT(DISTINCT topic) AS topic_count,
      jsonb_agg(DISTINCT to_jsonb(topic)) AS topics
    FROM public.institution_questions
    WHERE institution_id = p_institution_id
    GROUP BY subject
    ORDER BY subject
  )
  SELECT
    (SELECT COUNT(*) FROM public.institution_questions WHERE institution_id = p_institution_id)::integer AS total_questions,
    (SELECT COUNT(*) FROM public.institution_questions WHERE institution_id = p_institution_id AND is_published)::integer AS published_questions,
    (SELECT COUNT(*) FROM public.institution_questions WHERE institution_id = p_institution_id AND NOT is_published)::integer AS draft_questions,
    COALESCE(
      (SELECT jsonb_agg(
          jsonb_build_object(
            'subject', subject,
            'total', total,
            'published', published,
            'topicCount', topic_count,
            'topics', COALESCE(topics, '[]'::jsonb)
          )
        )
       FROM subject_stats),
      '[]'::jsonb
    ) AS subjects;
END;
$$;

GRANT EXECUTE ON FUNCTION public.institution_question_dashboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_question_dashboard(uuid) TO service_role;

-- Enable RLS and add policies for institution scoped tables
ALTER TABLE public.institution_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_exam_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_question_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution members can select own questions"
ON public.institution_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_questions.institution_id
      AND im.user_id = auth.uid()
  )
);

CREATE POLICY "Institution members can modify own questions"
ON public.institution_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_questions.institution_id
      AND im.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_questions.institution_id
      AND im.user_id = auth.uid()
  )
);

CREATE POLICY "Institution members can select exam blueprints"
ON public.institution_exam_blueprints
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_exam_blueprints.institution_id
      AND im.user_id = auth.uid()
  )
);

CREATE POLICY "Institution members can modify exam blueprints"
ON public.institution_exam_blueprints
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_exam_blueprints.institution_id
      AND im.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_exam_blueprints.institution_id
      AND im.user_id = auth.uid()
  )
);

-- Keep archive internal (no policies) so anon clients cannot read it

COMMENT ON TABLE public.institution_questions IS 'Institution scoped question bank with subject/topic categorization.';
COMMENT ON TABLE public.institution_exam_blueprints IS 'Saved exam templates referencing institution question bank selections.';
COMMENT ON TABLE public.institution_question_archive IS 'Global archive of every institution question, used for analytics and central knowledge.';
