-- =====================================================
-- COACH APPLICATION SYSTEM
-- Teachers can apply to become coaches
-- =====================================================

-- 1. Create coach_applications table
CREATE TABLE IF NOT EXISTS public.coach_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    avatar_url TEXT,

    -- Professional Information
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    bio TEXT NOT NULL,
    specializations TEXT[] NOT NULL,
    hourly_rate NUMERIC(10,2),

    -- Agreement
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,

    -- Application Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One application per teacher
    UNIQUE(teacher_id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_coach_applications_teacher ON public.coach_applications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_coach_applications_status ON public.coach_applications(status);
CREATE INDEX IF NOT EXISTS idx_coach_applications_created ON public.coach_applications(created_at DESC);

-- 3. Create trigger to auto-update profiles when approved
CREATE OR REPLACE FUNCTION auto_approve_coach_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- When application is approved, update profiles table
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE public.profiles
        SET
            is_coach = TRUE,
            coach_bio = NEW.bio,
            coach_specializations = NEW.specializations,
            coach_hourly_rate = NEW.hourly_rate,
            coach_availability_timezone = 'Europe/Istanbul',
            avatar_url = COALESCE(NEW.avatar_url, avatar_url),
            updated_at = NOW()
        WHERE id = NEW.teacher_id;

        NEW.reviewed_at = NOW();
    END IF;

    -- When application is rejected, remove coach status
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE public.profiles
        SET
            is_coach = FALSE,
            updated_at = NOW()
        WHERE id = NEW.teacher_id;

        NEW.reviewed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_approve_coach
    BEFORE UPDATE ON public.coach_applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION auto_approve_coach_profile();

-- 4. RLS Policies
ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;

-- Teachers can insert their own application
CREATE POLICY "Teachers can insert their own application"
ON public.coach_applications
FOR INSERT
TO authenticated
WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Teachers can view their own application
CREATE POLICY "Teachers can view their own application"
ON public.coach_applications
FOR SELECT
TO authenticated
USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'institution')
);

-- Teachers can update their pending application
CREATE POLICY "Teachers can update their pending application"
ON public.coach_applications
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid() AND status = 'pending')
WITH CHECK (teacher_id = auth.uid() AND status = 'pending');

-- Admins/Institutions can update any application
CREATE POLICY "Admins can update applications"
ON public.coach_applications
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('institution', 'admin')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('institution', 'admin')));

-- 5. Add coach_avatar storage bucket (will be created separately)
-- Storage bucket: coach-avatars
-- Public: true
-- File size limit: 2MB
-- Allowed types: image/jpeg, image/png, image/webp

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.coach_applications TO authenticated;

-- 7. Comments
COMMENT ON TABLE public.coach_applications IS 'Coach application system - teachers apply to become coaches';
COMMENT ON COLUMN public.coach_applications.status IS 'pending: waiting review, approved: can work as coach, rejected: denied';
COMMENT ON COLUMN public.coach_applications.terms_accepted IS 'Must accept platform terms before submitting';
