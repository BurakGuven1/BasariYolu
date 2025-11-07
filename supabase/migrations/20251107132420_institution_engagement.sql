/*
  # Institution Announcements & Assignments

  1. Add tables for institution-wide announcements and assignments
  2. Provide updated_at automation helpers
  3. Secure with RLS so only institution staff can manage, students can read
*/

-- Helper to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Announcements shared across an institution
CREATE TABLE IF NOT EXISTS public.institution_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'urgent')),
  audience text NOT NULL DEFAULT 'students' CHECK (audience IN ('students', 'teachers', 'all')),
  publish_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_institution_announcements_updated
BEFORE UPDATE ON public.institution_announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_institution_announcements_institution
  ON public.institution_announcements(institution_id, publish_at DESC);

-- Assignments / work packages provided by the institution
CREATE TABLE IF NOT EXISTS public.institution_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  subject text,
  due_date date,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_institution_assignments_updated
BEFORE UPDATE ON public.institution_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_institution_assignments_institution
  ON public.institution_assignments(institution_id, due_date, status);

-- RLS setup
ALTER TABLE public.institution_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_assignments ENABLE ROW LEVEL SECURITY;

-- Helper expressions
WITH member_policy AS (
  SELECT 1
)
SELECT 1;

-- Staff policies
CREATE POLICY "Institution members manage announcements"
ON public.institution_announcements
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_announcements.institution_id
      AND im.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_announcements.institution_id
      AND im.user_id = auth.uid()
  )
);

CREATE POLICY "Institution members manage assignments"
ON public.institution_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_assignments.institution_id
      AND im.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_assignments.institution_id
      AND im.user_id = auth.uid()
  )
);

-- Student read policies
CREATE POLICY "Institution students read announcements"
ON public.institution_announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.institution_student
      AND p.institution_id = institution_announcements.institution_id
  )
);

CREATE POLICY "Institution students read assignments"
ON public.institution_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.institution_student
      AND p.institution_id = institution_assignments.institution_id
  )
);

-- Allow institution staff to view student profiles within the same institution
CREATE POLICY "Institution staff view institution profiles"
ON public.profiles
FOR SELECT
USING (
  profiles.institution_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = profiles.institution_id
      AND im.user_id = auth.uid()
  )
);
