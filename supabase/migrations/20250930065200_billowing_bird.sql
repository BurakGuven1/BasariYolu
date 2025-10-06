/*
  # Create exam files table

  1. New Tables
    - `exam_files`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, foreign key to class_exams)
      - `class_id` (uuid, foreign key to classes)
      - `teacher_id` (uuid, foreign key to teachers)
      - `file_name` (text)
      - `file_path` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `exam_files` table
    - Add policies for teachers and students to access files
*/

CREATE TABLE IF NOT EXISTS exam_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES class_exams(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_files ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own exam files
CREATE POLICY "Teachers can manage exam files"
  ON exam_files
  FOR ALL
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE id = teacher_id
  ));

-- Students can view exam files from their classes
CREATE POLICY "Students can view exam files"
  ON exam_files
  FOR SELECT
  USING (class_id IN (
    SELECT cs.class_id 
    FROM class_students cs 
    JOIN students s ON s.id = cs.student_id 
    WHERE s.user_id = auth.uid() AND cs.status = 'active'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_files_exam_id ON exam_files(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_files_class_id ON exam_files(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_files_teacher_id ON exam_files(teacher_id);