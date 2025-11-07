/*
  # Institution subscription approval helpers

  Allow institution staff to create/update institution funded subscriptions
  on behalf of their invited students while keeping other subscription rows
  locked behind existing policies.
*/

ALTER TABLE public.user_subscriptions
  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_subscriptions'
      AND policyname = 'Institution staff manage institution subscriptions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Institution staff manage institution subscriptions"
      ON public.user_subscriptions
      FOR ALL
      USING (
        payment_provider = 'institution'
        AND EXISTS (
          SELECT 1
          FROM public.institution_student_requests isr
          JOIN public.institution_members im
            ON im.institution_id = isr.institution_id
          WHERE isr.user_id = public.user_subscriptions.user_id
            AND im.user_id = auth.uid()
        )
      )
      WITH CHECK (
        payment_provider = 'institution'
        AND EXISTS (
          SELECT 1
          FROM public.institution_student_requests isr
          JOIN public.institution_members im
            ON im.institution_id = isr.institution_id
          WHERE isr.user_id = public.user_subscriptions.user_id
            AND im.user_id = auth.uid()
        )
      );
    $policy$;
  END IF;
END;
$$;
