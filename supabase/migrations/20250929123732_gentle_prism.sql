/*
  # Disable RLS for Teacher Tables

  1. Security Changes
    - Disable RLS on teachers table
    - Disable RLS on classes table  
    - Disable RLS on class_students table
    - Disable RLS on class_payments table
  2. Notes
    - This removes all row-level security restrictions
    - Teachers can now create/manage classes without RLS issues
    - Simplifies the system for development/testing
*/

-- Disable RLS on all teacher-related tables
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "teachers_own_classes_only" ON classes;
DROP POLICY IF EXISTS "teachers_manage_class_students" ON class_students;
DROP POLICY IF EXISTS "students_view_own_memberships" ON class_students;
DROP POLICY IF EXISTS "public_read_active_classes" ON class_students;
DROP POLICY IF EXISTS "Allow teacher registration" ON teachers;
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
DROP POLICY IF EXISTS "Public read access to teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert own payments" ON class_payments;
DROP POLICY IF EXISTS "Teachers can view own payments" ON class_payments;

-- Clean up any remaining policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on teachers table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'teachers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON teachers';
    END LOOP;
    
    -- Drop all policies on classes table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'classes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON classes';
    END LOOP;
    
    -- Drop all policies on class_students table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'class_students'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON class_students';
    END LOOP;
    
    -- Drop all policies on class_payments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'class_payments'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON class_payments';
    END LOOP;
END $$;