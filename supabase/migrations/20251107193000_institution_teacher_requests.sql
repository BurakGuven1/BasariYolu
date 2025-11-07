/*
  # Institution Teacher Requests & Workflow

  - Store teacher onboarding requests that require institution approval
  - Update accept_institution_teacher_invite to create requests instead of direct memberships
  - Add helper functions for approval / rejection flows
*/

-- Table to capture teacher onboarding requests
CREATE TABLE IF NOT EXISTS public.institution_teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'code' CHECK (source IN ('code', 'invite')),
  invite_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_requests_institution_user
  ON public.institution_teacher_requests (institution_id, user_id);

CREATE INDEX IF NOT EXISTS idx_teacher_requests_status
  ON public.institution_teacher_requests (institution_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_teacher_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_requests_updated_at ON public.institution_teacher_requests;
CREATE TRIGGER trg_teacher_requests_updated_at
BEFORE UPDATE ON public.institution_teacher_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_teacher_request_updated_at();

ALTER TABLE public.institution_teacher_requests ENABLE ROW LEVEL SECURITY;

-- Managers can manage requests
DROP POLICY IF EXISTS "Institution staff manage teacher requests" ON public.institution_teacher_requests;
CREATE POLICY "Institution staff manage teacher requests"
ON public.institution_teacher_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_requests.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = institution_teacher_requests.institution_id
      AND im.user_id = auth.uid()
      AND im.role IN ('owner', 'manager')
  )
);

-- Teacher can view own request(s)
DROP POLICY IF EXISTS "Teacher view own requests" ON public.institution_teacher_requests;
CREATE POLICY "Teacher view own requests"
ON public.institution_teacher_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Updated invite acceptance: create request instead of membership
DROP FUNCTION IF EXISTS public.accept_institution_teacher_invite(text);
CREATE OR REPLACE FUNCTION public.accept_institution_teacher_invite(p_invite_code text)
RETURNS TABLE (
  request_id uuid,
  institution_id uuid,
  status text
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
  v_profile record;
  v_request_id uuid;
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

  IF EXISTS (
    SELECT 1
    FROM public.institution_teacher_requests r
    WHERE r.user_id = v_user_id
      AND r.institution_id = v_institution_id
      AND r.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Bu kurum için zaten bekleyen bir başvurunuz var.';
  END IF;

  SELECT full_name, email
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.institution_teacher_requests (
    institution_id,
    user_id,
    full_name,
    email,
    source,
    invite_code
  )
  VALUES (
    v_institution_id,
    v_user_id,
    COALESCE(v_profile.full_name, ''),
    COALESCE(v_profile.email, ''),
    CASE WHEN v_used_invite THEN 'invite' ELSE 'code' END,
    p_invite_code
  )
  RETURNING id INTO v_request_id;

  IF v_used_invite THEN
    UPDATE public.institution_teacher_invites
    SET status = 'applied',
        accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invite.id;
  END IF;

  RETURN QUERY SELECT v_request_id, v_institution_id, 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_institution_teacher_invite(text) TO authenticated;

-- Approve helper
CREATE OR REPLACE FUNCTION public.approve_institution_teacher_request(p_request_id uuid)
RETURNS TABLE (membership_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.institution_teacher_requests%ROWTYPE;
  v_actor uuid := auth.uid();
  v_membership_id uuid;
BEGIN
  SELECT *
  INTO v_request
  FROM public.institution_teacher_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Öğretmen isteği bulunamadı.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Bu başvuru zaten sonuçlandırılmış.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = v_request.institution_id
      AND im.user_id = v_actor
      AND im.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Yalnızca kurum yöneticileri onaylayabilir.';
  END IF;

  INSERT INTO public.institution_members (institution_id, user_id, role)
  VALUES (v_request.institution_id, v_request.user_id, 'teacher')
  ON CONFLICT (institution_id, user_id)
  DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_membership_id;

  UPDATE public.institution_teacher_requests
  SET status = 'approved',
      approved_by = v_actor,
      approved_at = now()
  WHERE id = p_request_id;

  UPDATE public.profiles
  SET institution_id = v_request.institution_id,
      updated_at = now()
  WHERE id = v_request.user_id
    AND (institution_id IS NULL OR institution_id = v_request.institution_id);

  RETURN QUERY SELECT v_membership_id;
END;
$$;

-- Reject helper
CREATE OR REPLACE FUNCTION public.reject_institution_teacher_request(p_request_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.institution_teacher_requests%ROWTYPE;
  v_actor uuid := auth.uid();
BEGIN
  SELECT *
  INTO v_request
  FROM public.institution_teacher_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Öğretmen isteği bulunamadı.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Bu başvuru zaten sonuçlandırılmış.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.institution_members im
    WHERE im.institution_id = v_request.institution_id
      AND im.user_id = v_actor
      AND im.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Yalnızca kurum yöneticileri reddedebilir.';
  END IF;

  UPDATE public.institution_teacher_requests
  SET status = 'rejected',
      approved_by = v_actor,
      approved_at = now(),
      rejection_reason = COALESCE(p_reason, 'Reddedildi')
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_institution_teacher_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_institution_teacher_request(uuid, text) TO authenticated;

-- Allow invite status to track applied state
ALTER TABLE public.institution_teacher_invites
DROP CONSTRAINT IF EXISTS institution_teacher_invites_status_check;

ALTER TABLE public.institution_teacher_invites
ADD CONSTRAINT institution_teacher_invites_status_check
CHECK (status IN ('pending', 'accepted', 'revoked', 'expired', 'applied'));
