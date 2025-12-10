-- =====================================================
-- FIX BIG FIVE FOREIGN KEY CONSTRAINTS
-- Change auth.users to public.profiles
-- =====================================================

-- Drop existing foreign key constraints
ALTER TABLE public.big_five_responses
DROP CONSTRAINT IF EXISTS big_five_responses_student_id_fkey;

ALTER TABLE public.big_five_results
DROP CONSTRAINT IF EXISTS big_five_results_student_id_fkey;

-- Add correct foreign key constraints pointing to profiles table
ALTER TABLE public.big_five_responses
ADD CONSTRAINT big_five_responses_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.big_five_results
ADD CONSTRAINT big_five_results_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS policies for big_five_responses
ALTER TABLE public.big_five_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can insert their own responses" ON public.big_five_responses;
DROP POLICY IF EXISTS "Students can view their own responses" ON public.big_five_responses;
DROP POLICY IF EXISTS "Students can update their own responses" ON public.big_five_responses;

-- Create new policies using user_id from profiles
CREATE POLICY "Students can insert their own responses"
ON public.big_five_responses
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view their own responses"
ON public.big_five_responses
FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update their own responses"
ON public.big_five_responses
FOR UPDATE
TO authenticated
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS policies for big_five_results
ALTER TABLE public.big_five_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can insert their own results" ON public.big_five_results;
DROP POLICY IF EXISTS "Students can view their own results" ON public.big_five_results;
DROP POLICY IF EXISTS "Students can update their own results" ON public.big_five_results;

-- Create new policies
CREATE POLICY "Students can insert their own results"
ON public.big_five_results
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view their own results"
ON public.big_five_results
FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update their own results"
ON public.big_five_results
FOR UPDATE
TO authenticated
USING (
  student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
