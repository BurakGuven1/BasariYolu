/*
  # Institution exam result policies

  Students can insert/read their own attempts, while institution staff
  can review results that belong to their institution.
*/

ALTER TABLE public.institution_exam_results
  ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'institution_exam_results'
      AND policyname = 'Institution students read exam results'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Institution students read exam results"
      ON public.institution_exam_results
      FOR SELECT
      USING (user_id = auth.uid());
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'institution_exam_results'
      AND policyname = 'Institution students insert exam results'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Institution students insert exam results"
      ON public.institution_exam_results
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'institution_exam_results'
      AND policyname = 'Institution staff read institution exam results'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Institution staff read institution exam results"
      ON public.institution_exam_results
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.institution_members im
          WHERE im.institution_id = institution_exam_results.institution_id
            AND im.user_id = auth.uid()
        )
      );
    $$;
  END IF;
END;
$policy$;
