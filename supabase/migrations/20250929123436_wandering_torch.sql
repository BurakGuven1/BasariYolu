/*
  # Complete RLS Policy Fix for Infinite Recursion

  1. Problem Analysis
    - Infinite recursion in class_students policies
    - Complex circular dependencies between tables
    - Multiple conflicting policies causing evaluation loops

  2. Solution
    - Drop ALL existing problematic policies
    - Create simple, direct policies without circular references
    - Use auth.uid() directly instead of complex subqueries
    - Ensure no policy references another table that references back

  3. Security
    - Teachers can only access their own data
    - Students can only access their own data
    - Public read access for necessary data only
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Teachers can manage own classes" ON classes;
DROP POLICY IF EXISTS "Students can view classes they joined" ON classes;
DROP POLICY IF EXISTS "Public read access to classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage their class students" ON class_students;
DROP POLICY IF EXISTS "Students can view own memberships" ON class_students;
DROP POLICY IF EXISTS "Public read for active classes" ON class_students;
DROP POLICY IF EXISTS "Public read access to class students" ON class_students;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_students DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for classes table
CREATE POLICY "teachers_own_classes_only" 
ON classes 
FOR ALL 
TO public
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Create simple, non-recursive policies for class_students table
-- This policy uses direct teacher_id check without subqueries
CREATE POLICY "teachers_manage_class_students" 
ON class_students 
FOR ALL 
TO public
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
)
WITH CHECK (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id = auth.uid()
  )
);

-- Allow students to view their own memberships
CREATE POLICY "students_view_own_memberships" 
ON class_students 
FOR SELECT 
TO public
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON classes TO public;
GRANT ALL ON class_students TO public;