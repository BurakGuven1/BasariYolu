/*
  # Fix ambiguous column reference in student_performance_summary

  - Qualify total_exams (and other columns) coming from the summary CTE
    to avoid ambiguity when Postgres resolves output column names inside
    the function body.
*/

CREATE OR REPLACE FUNCTION public.student_performance_summary(p_student_id uuid)
RETURNS TABLE (
  total_exams integer,
  average_score numeric,
  best_score numeric,
  last_scores jsonb,
  source_breakdown jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
  COALESCE(summary.total_exams, 0) AS total_exams,
  summary.average_score AS average_score,
  summary.best_score AS best_score,
  COALESCE(recent.payload, '[]'::jsonb) AS last_scores,
  COALESCE(breakdown.payload, '[]'::jsonb) AS source_breakdown
FROM summary
CROSS JOIN recent
CROSS JOIN breakdown;
$$;

GRANT EXECUTE ON FUNCTION public.student_performance_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_class_assignments(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  class_id uuid,
  teacher_id uuid,
  title text,
  description text,
  subject text,
  due_date date,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ca.id,
    ca.class_id,
    ca.teacher_id,
    ca.title,
    ca.description,
    ca.subject,
    ca.due_date,
    ca.created_at
  FROM public.class_assignments ca
  WHERE ca.class_id IN (
    SELECT class_id
    FROM public.class_students
    WHERE student_id = p_student_id
      AND status = 'active'
  )
  ORDER BY ca.due_date ASC NULLS LAST, ca.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.student_class_assignments(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_class_announcements(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  class_id uuid,
  teacher_id uuid,
  title text,
  content text,
  type text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ca.id,
    ca.class_id,
    ca.teacher_id,
    ca.title,
    ca.content,
    ca.type,
    ca.created_at
  FROM public.class_announcements ca
  WHERE ca.class_id IN (
    SELECT class_id
    FROM public.class_students
    WHERE student_id = p_student_id
      AND status = 'active'
  )
  ORDER BY ca.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.student_class_announcements(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.student_class_exam_results(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  class_exam_id uuid,
  class_id uuid,
  student_id uuid,
  score numeric,
  correct_answers integer,
  wrong_answers integer,
  empty_answers integer,
  student_note text,
  ranking integer,
  uploaded_at timestamptz,
  exam_name text,
  exam_date date,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cer.id,
    cer.class_exam_id,
    ce.class_id,
    cer.student_id,
    cer.score,
    cer.correct_answers,
    cer.wrong_answers,
    cer.empty_answers,
    cer.student_note,
    cer.ranking,
    cer.uploaded_at,
    ce.exam_name,
    ce.exam_date,
    cer.created_at
  FROM public.class_exam_results cer
  INNER JOIN public.class_exams ce ON ce.id = cer.class_exam_id
  WHERE cer.student_id = p_student_id
    AND ce.class_id IN (
      SELECT class_id
      FROM public.class_students
      WHERE student_id = p_student_id
        AND status = 'active'
    )
  ORDER BY ce.exam_date DESC NULLS LAST, cer.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.student_class_exam_results(uuid) TO authenticated;
