/*
  # Student Exam Artifacts & Metrics

  1. Allow teachers to upload exam artifacts (PDF/image) for each student
  2. Track structured exam metrics for reporting
  3. Provide aggregated performance summary helper
*/

-- Artifacts table (stored files metadata)
CREATE TABLE IF NOT EXISTS public.student_exam_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  exam_name text NOT NULL,
  exam_type text NOT NULL,
  source text NOT NULL DEFAULT 'institution' CHECK (source IN ('institution', 'school', 'external')),
  score numeric,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'image')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_artifacts_student
  ON public.student_exam_artifacts (student_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_artifacts_institution
  ON public.student_exam_artifacts (institution_id, created_at DESC);

ALTER TABLE public.student_exam_artifacts ENABLE ROW LEVEL SECURITY;

-- Teachers (institution members) can insert
DROP POLICY IF EXISTS "Teachers insert exam artifacts" ON public.student_exam_artifacts;
CREATE POLICY "Teachers insert exam artifacts"
ON public.student_exam_artifacts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = student_exam_artifacts.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager', 'teacher')
  )
);

-- Institution staff & assigned teacher can read
DROP POLICY IF EXISTS "Institution members read exam artifacts" ON public.student_exam_artifacts;
CREATE POLICY "Institution members read exam artifacts"
ON public.student_exam_artifacts
FOR SELECT
USING (
  auth.uid() = student_exam_artifacts.teacher_user_id
  OR EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = student_exam_artifacts.institution_id
      AND im.user_id = auth.uid()
  )
);

-- Students can read their own artifacts
DROP POLICY IF EXISTS "Students read own exam artifacts" ON public.student_exam_artifacts;
CREATE POLICY "Students read own exam artifacts"
ON public.student_exam_artifacts
FOR SELECT
USING (auth.uid() = student_exam_artifacts.student_user_id);

-- Metrics table
CREATE TABLE IF NOT EXISTS public.student_exam_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  exam_name text NOT NULL,
  exam_type text NOT NULL,
  source text NOT NULL DEFAULT 'institution' CHECK (source IN ('institution', 'school', 'external')),
  correct_count integer,
  wrong_count integer,
  blank_count integer,
  score numeric,
  percentile numeric,
  ranking integer,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_metrics_student
  ON public.student_exam_metrics (student_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_metrics_institution
  ON public.student_exam_metrics (institution_id, created_at DESC);

ALTER TABLE public.student_exam_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage exam metrics" ON public.student_exam_metrics;
CREATE POLICY "Teachers manage exam metrics"
ON public.student_exam_metrics
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = student_exam_metrics.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager', 'teacher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = student_exam_metrics.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager', 'teacher')
  )
);

DROP POLICY IF EXISTS "Students read own exam metrics" ON public.student_exam_metrics;
CREATE POLICY "Students read own exam metrics"
ON public.student_exam_metrics
FOR SELECT
USING (auth.uid() = student_exam_metrics.student_user_id);

-- Performance summary helper
CREATE OR REPLACE FUNCTION public.student_performance_summary(p_student_id uuid)
RETURNS TABLE (
  total_exams integer,
  average_score numeric,
  best_score numeric,
  last_scores jsonb,
  source_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH metric_scores AS (
    SELECT score, exam_name, source, created_at
    FROM public.student_exam_metrics
    WHERE student_user_id = p_student_id
      AND score IS NOT NULL
    UNION ALL
    SELECT score, exam_name, source, created_at
    FROM public.student_exam_artifacts
    WHERE student_user_id = p_student_id
      AND score IS NOT NULL
  ),
  ordered_scores AS (
    SELECT *
    FROM metric_scores
    ORDER BY created_at DESC
    LIMIT 8
  ),
  summary AS (
    SELECT
      COUNT(*) AS total_exams,
      AVG(score)::numeric AS average_score,
      MAX(score) AS best_score
    FROM metric_scores
  ),
  recent AS (
    SELECT
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'examName', exam_name,
            'score', score,
            'source', source,
            'createdAt', created_at
          )
          ORDER BY created_at DESC
        ),
        '[]'::jsonb
      ) AS payload
    FROM ordered_scores
  ),
  breakdown AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'source', source,
          'count', entry_count,
          'average', avg_score
        )
        ORDER BY source
      ),
      '[]'::jsonb
    ) AS payload
    FROM (
      SELECT
        source,
        COUNT(*) AS entry_count,
        AVG(score) AS avg_score
      FROM metric_scores
      GROUP BY source
    ) AS source_stats
  )
  SELECT
    COALESCE((SELECT total_exams FROM summary), 0) AS total_exams,
    (SELECT average_score FROM summary) AS average_score,
    (SELECT best_score FROM summary) AS best_score,
    (SELECT payload FROM recent) AS last_scores,
    COALESCE((SELECT payload FROM breakdown), '[]'::jsonb) AS source_breakdown;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_performance_summary(uuid) TO authenticated;
