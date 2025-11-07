/*
  # Fix teacher invite function ambiguity v2

  - Rename local variables to avoid clashes and explicitly return values
*/

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
  v_membership_id uuid;
  v_role text := 'teacher';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Giriş yapmalısınız.';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  SELECT
    v_user_id,
    COALESCE(auth_user.raw_user_meta_data ->> 'full_name', ''),
    auth_user.email,
    'teacher'
  FROM auth.users auth_user
  WHERE auth_user.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

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
  RETURNING id INTO v_membership_id;

  IF v_used_invite THEN
    UPDATE public.institution_teacher_invites
    SET status = 'accepted',
        accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invite.id;
  END IF;

  UPDATE public.profiles AS p
  SET institution_id = v_institution_id,
      updated_at = now()
  WHERE p.id = v_user_id
    AND (p.institution_id IS NULL OR p.institution_id = v_institution_id);

  RETURN QUERY SELECT v_membership_id, v_institution_id, v_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_institution_teacher_invite(text) TO authenticated;
