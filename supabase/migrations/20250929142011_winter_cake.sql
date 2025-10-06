/*
  # Add Class Management Tables

  1. New Tables
    - `class_assignments` - Sınıf ödevleri
    - `class_announcements` - Sınıf duyuruları  
    - `class_exams` - Sınıf sınavları
    - `class_exam_results` - Sınıf sınav sonuçları

  2. Constraints
    - Öğretmen maksimum 2 sınıf oluşturabilir
    - Tüm tablolar RLS kapalı (basitlik için)

  3. Functions
    - Sınıf sayısı kontrol fonksiyonu
*/

-- Class assignments table
CREATE TABLE IF NOT EXISTS class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Class announcements table
CREATE TABLE IF NOT EXISTS class_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  created_at timestamptz DEFAULT now()
);

-- Class exams table
CREATE TABLE IF NOT EXISTS class_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  exam_name text NOT NULL,
  exam_type text NOT NULL,
  exam_date date NOT NULL,
  total_questions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Class exam results table
CREATE TABLE IF NOT EXISTS class_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_exam_id uuid NOT NULL REFERENCES class_exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score numeric(5,2),
  correct_answers integer DEFAULT 0,
  wrong_answers integer DEFAULT 0,
  empty_answers integer DEFAULT 0,
  ranking integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_exam_id, student_id)
);

-- Disable RLS for all new tables
ALTER TABLE class_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_exam_results DISABLE ROW LEVEL SECURITY;

-- Function to check teacher class limit
CREATE OR REPLACE FUNCTION check_teacher_class_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM classes WHERE teacher_id = NEW.teacher_id AND status != 'completed') >= 2 THEN
    RAISE EXCEPTION 'Bir öğretmen maksimum 2 aktif sınıf oluşturabilir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce class limit
DROP TRIGGER IF EXISTS enforce_teacher_class_limit ON classes;
CREATE TRIGGER enforce_teacher_class_limit
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION check_teacher_class_limit();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_announcements_class_id ON class_announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exams_class_id ON class_exams(class_id);
CREATE INDEX IF NOT EXISTS idx_class_exam_results_class_exam_id ON class_exam_results(class_exam_id);
CREATE INDEX IF NOT EXISTS idx_class_exam_results_student_id ON class_exam_results(student_id);