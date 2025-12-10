-- Fix coaching appointments RLS policies
-- Allow students to create appointment requests (status = 'pending')

-- Drop old policy that only allowed coaches to create appointments
DROP POLICY IF EXISTS "Coaches can create appointments" ON public.coaching_appointments;

-- New policy: Students can create appointment requests
CREATE POLICY "Students can request appointments"
    ON public.coaching_appointments
    FOR INSERT
    WITH CHECK (
        auth.uid() = student_id
        AND status = 'pending'
    );

-- New policy: Coaches can also create appointments directly
CREATE POLICY "Coaches can create appointments"
    ON public.coaching_appointments
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Update existing policy: Coaches can update appointments (approve/reject)
DROP POLICY IF EXISTS "Coaches can update their appointments" ON public.coaching_appointments;

CREATE POLICY "Coaches can update their appointments"
    ON public.coaching_appointments
    FOR UPDATE
    USING (auth.uid() = coach_id)
    WITH CHECK (auth.uid() = coach_id);
