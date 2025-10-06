/*
  # Fix Class Students RLS Infinite Recursion

  1. Security Changes
    - Drop existing problematic RLS policies on class_students
    - Create simple, non-recursive policies
    - Ensure no circular dependencies between classes and class_students tables

  2. New Policies
    - Teachers can manage students in their own classes (direct teacher_id check)
    - Students can view their own class memberships (direct student_id check)
    - Public read access for basic class information
*/

-- Drop all existing policies on class_students to start fresh
DROP POLICY IF EXISTS "Public read access to class_students" ON class_students;
DROP POLICY IF EXISTS "Students can view own class memberships" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage class students" ON class_students;

-- Create simple, non-recursive policies
CREATE POLICY "Teachers can manage their class students"
  ON class_students
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own memberships"
  ON class_students
  FOR SELECT
  TO public
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public read for active classes"
  ON class_students
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_students.class_id 
      AND classes.status = 'active'
    )
  );