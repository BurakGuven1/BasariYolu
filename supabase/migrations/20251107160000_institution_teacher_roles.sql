/*
  # Institution Teacher Roles & Invites

  - Ensure a teacher can belong to only one institution at a time
  - Introduce institution_teacher_invites table for managed onboarding
  - Allow institution members (incl. teachers) to read announcements/assignments
  - Provide helper function for teachers to accept invites securely
*/

-- Ensure teachers are unique across institutions
CREATE UNIQUE INDEX IF NOT EXISTS idx_institution_teacher_unique_user
  ON public.institution_members (user_id)
  WHERE role = 'teacher';

-- Teacher invite table
CREATE TABLE IF NOT EXISTS public.institution_teacher_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  invite_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_institution_teacher_invites_email
  ON public.institution_teacher_invites (institution_id, lower(email))
  WHERE status = 'pending';

CREATE TRIGGER trg_institution_teacher_invites_updated
BEFORE UPDATE ON public.institution_teacher_invites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.institution_teacher_invites ENABLE ROW LEVEL SECURITY;

-- Policies for invites (owners/managers manage invites)
DROP POLICY IF EXISTS "Institution managers manage teacher invites" ON public.institution_teacher_invites;
CREATE POLICY "Institution managers manage teacher invites"
ON public.institution_teacher_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_invites.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_invites.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
);

-- (Optional) allow invite owners to view their own row by code? Not needed due to helper function.

-- Secure function for accepting invites
CREATE OR REPLACE FUNCTION public.accept_institution_teacher_invite(p_invite_code text)
RETURNS TABLE (membership_id uuid, institution_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.institution_teacher_invites%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Giriş yapmalısınız.';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.institution_teacher_invites
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Davet bulunamadı veya artık geçerli değil.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.user_id = v_user_id
      AND im.role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Bu öğretmen zaten başka bir kuruma bağlı.';
  END IF;

  INSERT INTO public.institution_members (institution_id, user_id, role)
  VALUES (v_invite.institution_id, v_user_id, 'teacher')
  RETURNING id, institution_id, role
  INTO membership_id, institution_id, role;

  UPDATE public.institution_teacher_invites
  SET status = 'accepted',
      accepted_at = now(),
      accepted_by = v_user_id
  WHERE id = v_invite.id;

  UPDATE public.profiles
  SET institution_id = v_invite.institution_id,
      updated_at = now()
  WHERE id = v_user_id
    AND (institution_id IS NULL OR institution_id = v_invite.institution_id);

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_institution_teacher_invite(text) TO authenticated;

-- Broaden announcement & assignment read access to institution members (teachers)
DROP POLICY IF EXISTS "Institution students read announcements" ON public.institution_announcements;
CREATE POLICY "Institution members read announcements"
ON public.institution_announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_announcements.institution_id
      AND im.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.institution_student
      AND p.institution_id = institution_announcements.institution_id
  )
);

DROP POLICY IF EXISTS "Institution students read assignments" ON public.institution_assignments;
CREATE POLICY "Institution members read assignments"
ON public.institution_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_assignments.institution_id
      AND im.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.institution_student
      AND p.institution_id = institution_assignments.institution_id
  )
);
