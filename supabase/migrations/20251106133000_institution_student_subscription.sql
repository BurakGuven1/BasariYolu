/*
  # Institution Student Subscription Automation

  1. Extend profiles with institution-specific flags
  2. Track subscription references on student requests
  3. Prepare institution_exam_results table for future exam tracking
*/

-- Profile level flags for institution students
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_student boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS institution_joined_at timestamptz,
  ADD COLUMN IF NOT EXISTS institution_subscription_expires_at timestamptz;

-- Link student requests to subscription/profile records
ALTER TABLE public.institution_student_requests
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_institution_student_requests_subscription ON public.institution_student_requests(subscription_id);
CREATE INDEX IF NOT EXISTS idx_institution_student_requests_profile ON public.institution_student_requests(student_profile_id);

-- Institution exam results table scaffold
CREATE TABLE IF NOT EXISTS public.institution_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_blueprint_id uuid REFERENCES public.institution_exam_blueprints(id) ON DELETE SET NULL,
  question_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  correct_count integer DEFAULT 0,
  wrong_count integer DEFAULT 0,
  empty_count integer DEFAULT 0,
  score numeric(5,2),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institution_exam_results_institution ON public.institution_exam_results(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_exam_results_student ON public.institution_exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_institution_exam_results_blueprint ON public.institution_exam_results(exam_blueprint_id);

COMMENT ON TABLE public.institution_exam_results IS 'Exam attempts created from institution blueprints for institution-managed students.';
