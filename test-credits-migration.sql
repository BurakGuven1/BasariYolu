-- Test Script: Check if AI Credits Migration is Applied
-- Run this in Supabase SQL Editor to check migration status

-- 1. Check if student_ai_usage table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'student_ai_usage'
) as student_ai_usage_exists;

-- 2. Check if ai_questions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'ai_questions'
) as ai_questions_exists;

-- 3. Check if get_student_ai_credits function exists
SELECT EXISTS (
  SELECT FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'get_student_ai_credits'
) as get_student_ai_credits_exists;

-- 4. Check if use_ai_credit function exists
SELECT EXISTS (
  SELECT FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'use_ai_credit'
) as use_ai_credit_exists;

-- If all return TRUE, migration is applied successfully
-- If any return FALSE, you need to run the migration file
