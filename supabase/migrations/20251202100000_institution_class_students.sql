-- Institution Class-Student Relationship System
-- Öğrencilerin sınıflara atanması ve yönetimi

-- ==============================================================
-- INSTITUTION CLASS STUDENTS (Sınıf-Öğrenci İlişkisi)
-- ==============================================================

CREATE TABLE IF NOT EXISTS institution_class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES institution_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tarihler
  enrollment_date DATE DEFAULT CURRENT_DATE,
  exit_date DATE,

  -- Durum
  is_active BOOLEAN DEFAULT true,

  -- Notlar
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Bir öğrenci bir sınıfta sadece 1 kez aktif olabilir
  UNIQUE(institution_id, class_id, student_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_students_institution
  ON institution_class_students(institution_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class
  ON institution_class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student
  ON institution_class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_active
  ON institution_class_students(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_class_students_class_active
  ON institution_class_students(class_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE institution_class_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Kurum yöneticileri (owner/manager) tüm işlemleri yapabilir
CREATE POLICY "Institution admins can manage class students"
  ON institution_class_students
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_class_students.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_class_students.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role IN ('owner', 'manager')
    )
  );

-- Öğretmenler kendi sınıflarının öğrencilerini görüntüleyebilir
CREATE POLICY "Teachers can view their class students"
  ON institution_class_students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institution_members
      WHERE institution_members.institution_id = institution_class_students.institution_id
      AND institution_members.user_id = auth.uid()
      AND institution_members.role = 'teacher'
    )
  );

-- Öğrenciler kendi kayıtlarını görüntüleyebilir
CREATE POLICY "Students can view their own class enrollment"
  ON institution_class_students
  FOR SELECT
  USING (student_id = auth.uid());

-- Öğrenciler kendi aktif sınıflarını güncelleyebilir (sınıf seçimi için)
CREATE POLICY "Students can update their class selection"
  ON institution_class_students
  FOR UPDATE
  USING (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM institution_student_requests
      WHERE institution_student_requests.user_id = auth.uid()
      AND institution_student_requests.institution_id = institution_class_students.institution_id
      AND institution_student_requests.status = 'approved'
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_institution_class_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_institution_class_students_updated_at
  BEFORE UPDATE ON institution_class_students
  FOR EACH ROW
  EXECUTE FUNCTION update_institution_class_students_updated_at();

-- Comments
COMMENT ON TABLE institution_class_students IS 'Öğrencilerin kurum sınıflarına atanması';
COMMENT ON COLUMN institution_class_students.student_id IS 'References auth.users.id (student user ID)';
COMMENT ON COLUMN institution_class_students.is_active IS 'Aktif kayıt - öğrenci şu anda bu sınıfta mı?';
COMMENT ON COLUMN institution_class_students.exit_date IS 'Sınıftan ayrılma tarihi (sınıf değiştirme için)';
