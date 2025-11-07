/*
  # Institution Teacher Codes

  1. Add teacher_invite_code to institutions for generic teacher onboarding
  2. Extend accept_institution_teacher_invite to accept both targeted invites and generic codes
*/

-- Add teacher invite code column (unique per institution)
ALTER TABLE public.institutions
ADD COLUMN IF NOT EXISTS teacher_invite_code text;

UPDATE public.institutions
SET teacher_invite_code = upper(substr(md5(gen_random_uuid()::text), 1, 10))
WHERE teacher_invite_code IS NULL;

ALTER TABLE public.institutions
ALTER COLUMN teacher_invite_code SET DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 10));

CREATE UNIQUE INDEX IF NOT EXISTS idx_institutions_teacher_invite_code
  ON public.institutions (teacher_invite_code);

-- Update invite acceptance function to support institution-level codes
CREATE OR REPLACE FUNCTION public.accept_institution_teacher_invite(p_invite_code text)
RETURNS TABLE (
  membership_id uuid,
  institution_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.institution_teacher_invites%ROWTYPE;
  v_user_id uuid := auth.uid();
  v_institution_id uuid;
  v_used_invite boolean := false;
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

  IF FOUND THEN
    v_institution_id := v_invite.institution_id;
    v_used_invite := true;
  ELSE
    SELECT id
    INTO v_institution_id
    FROM public.institutions
    WHERE teacher_invite_code = p_invite_code
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Davet bulunamadı veya artık geçerli değil.';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.user_id = v_user_id
      AND im.role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Bu öğretmen zaten bir kuruma bağlı.';
  END IF;

  INSERT INTO public.institution_members (institution_id, user_id, role)
  VALUES (v_institution_id, v_user_id, 'teacher')
  RETURNING id, institution_id, role
  INTO membership_id, institution_id, role;

  IF v_used_invite THEN
    UPDATE public.institution_teacher_invites
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invite.id;
  END IF;

  UPDATE public.profiles
  SET institution_id = v_institution_id,
      updated_at = now()
  WHERE id = v_user_id
    AND (institution_id IS NULL OR institution_id = v_institution_id);

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_institution_teacher_invite(text) TO authenticated;
