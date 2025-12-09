-- =====================================================
-- FIX COACHING SYSTEM FOREIGN KEYS
-- =====================================================
-- This migration fixes foreign key references to use profiles instead of auth.users

-- Drop existing foreign keys
ALTER TABLE public.coaching_appointments
DROP CONSTRAINT IF EXISTS coaching_appointments_coach_id_fkey,
DROP CONSTRAINT IF EXISTS coaching_appointments_student_id_fkey;

ALTER TABLE public.student_coaching_subscriptions
DROP CONSTRAINT IF EXISTS student_coaching_subscriptions_coach_id_fkey,
DROP CONSTRAINT IF EXISTS student_coaching_subscriptions_student_id_fkey;

ALTER TABLE public.coach_availability
DROP CONSTRAINT IF EXISTS coach_availability_coach_id_fkey;

-- Add new foreign keys referencing profiles table (via user_id)
-- Note: profiles.user_id is the foreign key to auth.users(id)

-- Coaching Appointments
ALTER TABLE public.coaching_appointments
ADD CONSTRAINT coaching_appointments_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.coaching_appointments
ADD CONSTRAINT coaching_appointments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Student Coaching Subscriptions
ALTER TABLE public.student_coaching_subscriptions
ADD CONSTRAINT student_coaching_subscriptions_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.student_coaching_subscriptions
ADD CONSTRAINT student_coaching_subscriptions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Coach Availability
ALTER TABLE public.coach_availability
ADD CONSTRAINT coach_availability_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update RLS policies to work with the new foreign keys
-- (They already use auth.uid() which matches profiles.user_id, so no changes needed)

COMMENT ON CONSTRAINT coaching_appointments_coach_id_fkey ON public.coaching_appointments
IS 'Foreign key to profiles table via user_id';

COMMENT ON CONSTRAINT student_coaching_subscriptions_coach_id_fkey ON public.student_coaching_subscriptions
IS 'Foreign key to profiles table via user_id';
